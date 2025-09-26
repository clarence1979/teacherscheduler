// Calendar integration system for Teacher Scheduler AI
// Supports bi-directional sync with Google Calendar, Outlook, and other providers

import { Event } from './types';

interface CalendarCredentials {
  apiKey: string;
  accessToken: string;
  refreshToken?: string;
}

interface CalendarProvider {
  authenticate(credentials: CalendarCredentials): Promise<void>;
  getEvents(timeMin?: Date, timeMax?: Date): Promise<Event[]>;
  createEvents(events: Partial<Event>[]): Promise<string[]>;
  updateEvent(eventId: string, updates: Partial<Event>): Promise<void>;
  deleteEvent(eventId: string): Promise<void>;
}

interface SyncResult {
  success: boolean;
  syncedEvents: number;
  errors: string[];
}

export class CalendarIntegration {
  private providers: Map<string, CalendarProvider> = new Map();
  private syncInterval: number = 5 * 60 * 1000; // 5 minutes
  private lastSync: Date | null = null;
  private syncIntervalId: NodeJS.Timeout | null = null;
  private eventListeners: Set<(events: Event[]) => void> = new Set();

  constructor() {
    // Initialize with default providers
    this.registerProvider('google', new GoogleCalendarProvider());
    this.registerProvider('outlook', new OutlookCalendarProvider());
  }

  // Register calendar providers
  registerProvider(name: string, provider: CalendarProvider): void {
    this.providers.set(name, provider);
  }

  // Connect to external calendar
  async connectCalendar(providerName: string, credentials: CalendarCredentials): Promise<{ success: boolean; provider?: string; error?: string }> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      return { success: false, error: `Provider ${providerName} not found` };
    }

    try {
      await provider.authenticate(credentials);
      this.startSyncing(providerName);
      return { success: true, provider: providerName };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // Sync events from external calendar
  async syncEvents(providerName: string): Promise<SyncResult> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      return { success: false, syncedEvents: 0, errors: [`Provider ${providerName} not found`] };
    }

    try {
      const timeMin = new Date();
      const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days ahead

      const externalEvents = await provider.getEvents(timeMin, timeMax);
      const motionEvents = this.getMotionEvents();

      // Merge events without duplicates
      const mergedEvents = this.mergeEvents(externalEvents, motionEvents);
      
      // Update local storage
      this.updateLocalEvents(mergedEvents);
      this.lastSync = new Date();
      
      return {
        success: true,
        syncedEvents: externalEvents.length,
        errors: []
      };
    } catch (error) {
      console.error('Sync error:', error);
      return {
        success: false,
        syncedEvents: 0,
        errors: [(error as Error).message]
      };
    }
  }

  // Push Motion tasks to external calendar
  async pushTasksToCalendar(providerName: string, tasks: any[]): Promise<boolean> {
    const provider = this.providers.get(providerName);
    if (!provider) return false;

    const calendarEvents = tasks
      .filter(task => task.scheduledTime)
      .map(task => ({
        title: task.name,
        start: task.scheduledTime,
        end: new Date(task.scheduledTime.getTime() + task.estimatedMinutes * 60000),
        description: task.description || '',
        source: 'Motion',
        externalId: `motion-task-${task.id}`
      }));

    try {
      await provider.createEvents(calendarEvents);
      return true;
    } catch (error) {
      console.error('Failed to push tasks:', error);
      return false;
    }
  }

  // Subscribe to event updates
  onEventsUpdated(callback: (events: Event[]) => void): void {
    this.eventListeners.add(callback);
  }

  // Unsubscribe from event updates
  offEventsUpdated(callback: (events: Event[]) => void): void {
    this.eventListeners.delete(callback);
  }

  private mergeEvents(externalEvents: Event[], motionEvents: Event[]): Event[] {
    const eventMap = new Map<string, Event>();

    // Add external events first
    externalEvents.forEach(event => {
      eventMap.set(event.externalId || event.id, { ...event, source: 'external' });
    });

    // Add Motion events, overriding conflicts
    motionEvents.forEach(event => {
      eventMap.set(event.id, { ...event, source: 'motion' });
    });

    return Array.from(eventMap.values());
  }

  private startSyncing(providerName: string): void {
    // Clear existing interval
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
    }

    // Set up recurring sync
    this.syncIntervalId = setInterval(async () => {
      await this.syncEvents(providerName);
    }, this.syncInterval);

    // Initial sync
    this.syncEvents(providerName);
  }

  private getMotionEvents(): Event[] {
    // Get events from global state or local storage
    if (typeof window !== 'undefined' && (window as any).motionState) {
      return (window as any).motionState.events || [];
    }
    return [];
  }

  private updateLocalEvents(events: Event[]): void {
    if (typeof window !== 'undefined') {
      if (!(window as any).motionState) {
        (window as any).motionState = {};
      }
      (window as any).motionState.events = events;
      
      // Notify listeners
      this.eventListeners.forEach(callback => callback(events));
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('motionEventsUpdated', { detail: events }));
    }
  }

  // Stop syncing
  stopSyncing(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
  }

  // Get sync status
  getSyncStatus(): { lastSync: Date | null; isActive: boolean } {
    return {
      lastSync: this.lastSync,
      isActive: this.syncIntervalId !== null
    };
  }
}

// Google Calendar Provider Implementation
class GoogleCalendarProvider implements CalendarProvider {
  private apiKey: string = '';
  private accessToken: string = '';

  async authenticate(credentials: CalendarCredentials): Promise<void> {
    this.apiKey = credentials.apiKey;
    this.accessToken = credentials.accessToken;
    
    // Verify credentials by making a test request
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/users/me/calendarList?key=${this.apiKey}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Google Calendar authentication failed');
    }
  }

  async getEvents(timeMin = new Date(), timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)): Promise<Event[]> {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      `timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}&key=${this.apiKey}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Google Calendar events');
    }

    const data = await response.json();
    
    return data.items?.map((event: any) => ({
      id: event.id,
      title: event.summary || 'Untitled Event',
      start: new Date(event.start.dateTime || event.start.date),
      end: new Date(event.end.dateTime || event.end.date),
      description: event.description || '',
      source: 'google',
      externalId: event.id,
      provider: 'google',
      busy: true
    })) || [];
  }

  async createEvents(events: Partial<Event>[]): Promise<string[]> {
    const promises = events.map(event => 
      fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          summary: event.title,
          description: event.description,
          start: { dateTime: event.start?.toISOString() },
          end: { dateTime: event.end?.toISOString() }
        })
      }).then(response => response.json()).then(data => data.id)
    );

    return Promise.all(promises);
  }

  async updateEvent(eventId: string, updates: Partial<Event>): Promise<void> {
    await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}?key=${this.apiKey}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        summary: updates.title,
        description: updates.description,
        start: updates.start ? { dateTime: updates.start.toISOString() } : undefined,
        end: updates.end ? { dateTime: updates.end.toISOString() } : undefined
      })
    });
  }

  async deleteEvent(eventId: string): Promise<void> {
    await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}?key=${this.apiKey}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });
  }
}

// Outlook Calendar Provider Implementation
class OutlookCalendarProvider implements CalendarProvider {
  private accessToken: string = '';

  async authenticate(credentials: CalendarCredentials): Promise<void> {
    // For Microsoft SSO, we only need the access token
    this.accessToken = credentials.accessToken || credentials.apiKey;
    
    // Verify credentials
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Microsoft authentication failed: ${errorData.error?.message || response.statusText}`);
    }
    
    console.log('Microsoft Calendar authentication successful');
  }

  async getEvents(timeMin = new Date(), timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)): Promise<Event[]> {
    const timeMinISO = timeMin.toISOString();
    const timeMaxISO = timeMax.toISOString();
    
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/events?` +
      `$filter=start/dateTime ge '${timeMinISO}' and end/dateTime le '${timeMaxISO}'&` +
      `$select=id,subject,start,end,body,isAllDay,showAs&` +
      `$orderby=start/dateTime`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to fetch Outlook events: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    return data.value?.map((event: any) => ({
      id: event.id,
      title: event.subject || 'Untitled Event',
      start: new Date(event.start.dateTime),
      end: new Date(event.end.dateTime),
      description: event.body?.content?.replace(/<[^>]*>/g, '') || '', // Strip HTML
      source: 'outlook',
      externalId: event.id,
      provider: 'outlook',
      busy: event.showAs !== 'free'
    })) || [];
  }

  async createEvents(events: Partial<Event>[]): Promise<string[]> {
    const promises = events.map(event => 
      fetch('https://graph.microsoft.com/v1.0/me/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subject: event.title,
          body: {
            contentType: 'text',
            content: event.description
          },
          start: {
            dateTime: event.start?.toISOString(),
            timeZone: 'UTC'
          },
          end: {
            dateTime: event.end?.toISOString(),
            timeZone: 'UTC'
          }
        })
      }).then(response => response.json()).then(data => data.id)
    );

    return Promise.all(promises);
  }

  async updateEvent(eventId: string, updates: Partial<Event>): Promise<void> {
    await fetch(`https://graph.microsoft.com/v1.0/me/events/${eventId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subject: updates.title,
        body: updates.description ? {
          contentType: 'text',
          content: updates.description
        } : undefined,
        start: updates.start ? {
          dateTime: updates.start.toISOString(),
          timeZone: 'UTC'
        } : undefined,
        end: updates.end ? {
          dateTime: updates.end.toISOString(),
          timeZone: 'UTC'
        } : undefined
      })
    });
  }

  async deleteEvent(eventId: string): Promise<void> {
    await fetch(`https://graph.microsoft.com/v1.0/me/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });
  }
}