// Smart Meeting Scheduler for Teacher Scheduler AI with Booking Links and Buffer Management
import { Event, TimeSlot, UserSchedule } from './types';

interface BookingLink {
  id: string;
  name: string;
  description: string;
  duration: number; // minutes
  bufferBefore: number; // minutes
  bufferAfter: number; // minutes
  availableTimeSlots: TimeSlot[];
  meetingType: 'video' | 'phone' | 'in-person';
  maxMeetingsPerDay: number;
  advanceNotice: number; // hours
  isActive: boolean;
  slug: string;
  settings: {
    requireConfirmation: boolean;
    allowRescheduling: boolean;
    sendReminders: boolean;
    collectAttendeeInfo: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface Meeting {
  id: string;
  bookingLinkId: string;
  title: string;
  attendeeEmail: string;
  attendeeName: string;
  startTime: Date;
  endTime: Date;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
  meetingLink?: string;
  notes?: string;
  createdAt: Date;
}

interface AvailabilitySlot {
  start: Date;
  end: Date;
  isOptimal: boolean;
  score: number;
  conflicts: string[];
}

export class MeetingScheduler {
  private userSchedule: UserSchedule;
  private bookingLinks: Map<string, BookingLink> = new Map();
  private meetings: Map<string, Meeting> = new Map();
  private existingEvents: Event[] = [];

  constructor(userSchedule: UserSchedule) {
    this.userSchedule = userSchedule;
  }

  // Create a booking link for external meetings
  createBookingLink(linkData: {
    name: string;
    description?: string;
    duration?: number;
    bufferBefore?: number;
    bufferAfter?: number;
    meetingType?: 'video' | 'phone' | 'in-person';
    maxMeetingsPerDay?: number;
    advanceNotice?: number;
  }): BookingLink {
    const bookingLink: BookingLink = {
      id: this.generateId(),
      name: linkData.name,
      description: linkData.description || '',
      duration: linkData.duration || 60,
      bufferBefore: linkData.bufferBefore || 15,
      bufferAfter: linkData.bufferAfter || 15,
      availableTimeSlots: this.getDefaultAvailability(),
      meetingType: linkData.meetingType || 'video',
      maxMeetingsPerDay: linkData.maxMeetingsPerDay || 8,
      advanceNotice: linkData.advanceNotice || 24,
      isActive: true,
      slug: this.generateSlug(linkData.name),
      settings: {
        requireConfirmation: false,
        allowRescheduling: true,
        sendReminders: true,
        collectAttendeeInfo: true
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.bookingLinks.set(bookingLink.id, bookingLink);
    return bookingLink;
  }

  // Get available time slots for a booking link
  getAvailableSlots(
    bookingLinkId: string, 
    date: Date, 
    timezone: string = 'UTC'
  ): AvailabilitySlot[] {
    const bookingLink = this.bookingLinks.get(bookingLinkId);
    if (!bookingLink || !bookingLink.isActive) {
      return [];
    }

    // Check advance notice requirement
    const minBookingTime = new Date();
    minBookingTime.setHours(minBookingTime.getHours() + bookingLink.advanceNotice);
    
    if (date < minBookingTime) {
      return [];
    }

    // Check daily meeting limit
    const dailyMeetings = this.getMeetingsForDate(date);
    if (dailyMeetings.length >= bookingLink.maxMeetingsPerDay) {
      return [];
    }

    // Generate potential slots
    const potentialSlots = this.generatePotentialSlots(date, bookingLink);
    
    // Filter and score slots
    const availableSlots = potentialSlots
      .filter(slot => this.isSlotAvailable(slot, bookingLink))
      .map(slot => this.scoreSlot(slot, bookingLink))
      .sort((a, b) => b.score - a.score);

    return availableSlots;
  }

  // Book a meeting slot
  bookMeeting(
    bookingLinkId: string,
    slotStart: Date,
    attendeeInfo: {
      name: string;
      email: string;
      notes?: string;
    }
  ): Meeting {
    const bookingLink = this.bookingLinks.get(bookingLinkId);
    if (!bookingLink) {
      throw new Error('Booking link not found');
    }

    const slotEnd = new Date(slotStart.getTime() + bookingLink.duration * 60000);

    // Verify slot is still available
    const availableSlots = this.getAvailableSlots(bookingLinkId, slotStart);
    const isSlotAvailable = availableSlots.some(slot => 
      slot.start.getTime() === slotStart.getTime()
    );

    if (!isSlotAvailable) {
      throw new Error('Selected time slot is no longer available');
    }

    const meeting: Meeting = {
      id: this.generateId(),
      bookingLinkId,
      title: `${bookingLink.name} with ${attendeeInfo.name}`,
      attendeeEmail: attendeeInfo.email,
      attendeeName: attendeeInfo.name,
      startTime: slotStart,
      endTime: slotEnd,
      status: bookingLink.settings.requireConfirmation ? 'scheduled' : 'confirmed',
      meetingLink: this.generateMeetingLink(bookingLink.meetingType),
      notes: attendeeInfo.notes,
      createdAt: new Date()
    };

    this.meetings.set(meeting.id, meeting);

    // Create buffer events
    this.createBufferEvents(meeting, bookingLink);

    // Send confirmation email (would integrate with email service)
    this.sendConfirmationEmail(meeting, bookingLink);

    return meeting;
  }

  // Find optimal meeting times between multiple participants
  findOptimalMeetingTimes(
    duration: number,
    participantSchedules: UserSchedule[],
    preferredTimeRanges?: { start: string; end: string }[],
    maxSuggestions: number = 5
  ): AvailabilitySlot[] {
    const suggestions: AvailabilitySlot[] = [];
    const today = new Date();
    
    // Look ahead 14 days
    for (let day = 0; day < 14; day++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + day);
      
      const daySlots = this.findDayOptimalSlots(
        checkDate,
        duration,
        participantSchedules,
        preferredTimeRanges
      );
      
      suggestions.push(...daySlots);
    }

    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSuggestions);
  }

  private findDayOptimalSlots(
    date: Date,
    duration: number,
    participantSchedules: UserSchedule[],
    preferredTimeRanges?: { start: string; end: string }[]
  ): AvailabilitySlot[] {
    const slots: AvailabilitySlot[] = [];
    
    // Find common working hours
    const commonWorkingHours = this.findCommonWorkingHours(participantSchedules, date);
    if (!commonWorkingHours) return slots;

    // Generate 30-minute slots within common hours
    const current = new Date(date);
    current.setHours(commonWorkingHours.start, 0, 0, 0);
    
    const endTime = new Date(date);
    endTime.setHours(commonWorkingHours.end, 0, 0, 0);

    while (current.getTime() + duration * 60000 <= endTime.getTime()) {
      const slotEnd = new Date(current.getTime() + duration * 60000);
      
      const slot: AvailabilitySlot = {
        start: new Date(current),
        end: slotEnd,
        isOptimal: false,
        score: 0,
        conflicts: []
      };

      // Check availability for all participants
      const isAvailable = participantSchedules.every(schedule => 
        this.isTimeSlotFree(slot.start, slot.end, schedule)
      );

      if (isAvailable) {
        slot.score = this.calculateSlotScore(slot, preferredTimeRanges);
        slot.isOptimal = slot.score > 0.7;
        slots.push(slot);
      }

      current.setTime(current.getTime() + 30 * 60000); // 30-minute increments
    }

    return slots;
  }

  private findCommonWorkingHours(
    schedules: UserSchedule[],
    date: Date
  ): { start: number; end: number } | null {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof UserSchedule['workingHours'];
    
    let latestStart = 0;
    let earliestEnd = 24;

    for (const schedule of schedules) {
      const dayHours = schedule.workingHours[dayName];
      if (!dayHours) return null; // Someone doesn't work this day

      latestStart = Math.max(latestStart, dayHours[0]);
      earliestEnd = Math.min(earliestEnd, dayHours[1]);
    }

    if (latestStart >= earliestEnd) return null; // No overlap

    return { start: latestStart, end: earliestEnd };
  }

  private generatePotentialSlots(date: Date, bookingLink: BookingLink): AvailabilitySlot[] {
    const slots: AvailabilitySlot[] = [];
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof UserSchedule['workingHours'];
    const workHours = this.userSchedule.workingHours[dayName];
    
    if (!workHours) return slots;

    const workStart = new Date(date);
    workStart.setHours(workHours[0], 0, 0, 0);
    
    const workEnd = new Date(date);
    workEnd.setHours(workHours[1], 0, 0, 0);

    const current = new Date(workStart);
    
    while (current.getTime() + bookingLink.duration * 60000 <= workEnd.getTime()) {
      const slotEnd = new Date(current.getTime() + bookingLink.duration * 60000);
      
      slots.push({
        start: new Date(current),
        end: slotEnd,
        isOptimal: false,
        score: 0,
        conflicts: []
      });

      current.setTime(current.getTime() + 30 * 60000); // 30-minute increments
    }

    return slots;
  }

  private isSlotAvailable(slot: AvailabilitySlot, bookingLink: BookingLink): boolean {
    // Check for conflicts with existing events (including buffers)
    const bufferStart = new Date(slot.start.getTime() - bookingLink.bufferBefore * 60000);
    const bufferEnd = new Date(slot.end.getTime() + bookingLink.bufferAfter * 60000);

    return !this.existingEvents.some(event => 
      this.timePeriodsOverlap(
        bufferStart, bufferEnd,
        event.start, event.end
      )
    );
  }

  private scoreSlot(slot: AvailabilitySlot, bookingLink: BookingLink): AvailabilitySlot {
    let score = 0.5; // Base score

    const hour = slot.start.getHours();
    
    // Prefer mid-morning and early afternoon
    if (hour >= 10 && hour <= 11) score += 0.3;
    else if (hour >= 14 && hour <= 15) score += 0.2;
    else if (hour >= 9 && hour <= 16) score += 0.1;
    
    // Avoid very early or late hours
    if (hour < 9 || hour > 17) score -= 0.2;
    
    // Prefer Tuesday-Thursday
    const dayOfWeek = slot.start.getDay();
    if (dayOfWeek >= 2 && dayOfWeek <= 4) score += 0.1;
    
    slot.score = Math.max(0, Math.min(1, score));
    slot.isOptimal = slot.score > 0.7;
    
    return slot;
  }

  private calculateSlotScore(
    slot: AvailabilitySlot,
    preferredTimeRanges?: { start: string; end: string }[]
  ): number {
    let score = 0.5;

    // Time of day preferences
    const hour = slot.start.getHours();
    if (hour >= 10 && hour <= 11) score += 0.3; // Peak productivity
    else if (hour >= 14 && hour <= 15) score += 0.2; // Post-lunch focus
    else if (hour >= 9 && hour <= 16) score += 0.1; // Standard work hours

    // Day of week preferences
    const dayOfWeek = slot.start.getDay();
    if (dayOfWeek >= 2 && dayOfWeek <= 4) score += 0.1; // Tue-Thu preferred

    // Preferred time ranges
    if (preferredTimeRanges) {
      const timeString = slot.start.toTimeString().substr(0, 5);
      const inPreferredRange = preferredTimeRanges.some(range => 
        timeString >= range.start && timeString <= range.end
      );
      if (inPreferredRange) score += 0.2;
    }

    return Math.max(0, Math.min(1, score));
  }

  private isTimeSlotFree(start: Date, end: Date, schedule: UserSchedule): boolean {
    // This would check against the participant's actual calendar
    // For now, just check working hours
    const dayName = start.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof UserSchedule['workingHours'];
    const workHours = schedule.workingHours[dayName];
    
    if (!workHours) return false;
    
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    
    return startHour >= workHours[0] && endHour <= workHours[1];
  }

  private createBufferEvents(meeting: Meeting, bookingLink: BookingLink): void {
    // Create buffer before meeting
    if (bookingLink.bufferBefore > 0) {
      const bufferStart = new Date(meeting.startTime.getTime() - bookingLink.bufferBefore * 60000);
      const bufferEvent: Event = {
        id: `buffer-before-${meeting.id}`,
        userId: 'current-user',
        title: `Buffer before ${meeting.title}`,
        start: bufferStart,
        end: meeting.startTime,
        source: 'booking',
        busy: true
      };
      this.existingEvents.push(bufferEvent);
    }

    // Create buffer after meeting
    if (bookingLink.bufferAfter > 0) {
      const bufferEnd = new Date(meeting.endTime.getTime() + bookingLink.bufferAfter * 60000);
      const bufferEvent: Event = {
        id: `buffer-after-${meeting.id}`,
        userId: 'current-user',
        title: `Buffer after ${meeting.title}`,
        start: meeting.endTime,
        end: bufferEnd,
        source: 'booking',
        busy: true
      };
      this.existingEvents.push(bufferEvent);
    }
  }

  private getMeetingsForDate(date: Date): Meeting[] {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return Array.from(this.meetings.values()).filter(meeting =>
      meeting.startTime >= startOfDay && meeting.startTime <= endOfDay
    );
  }

  private timePeriodsOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
    return start1 < end2 && start2 < end1;
  }

  private getDefaultAvailability(): TimeSlot[] {
    // Generate default availability based on user's working hours
    const slots: TimeSlot[] = [];
    const workHours = this.userSchedule.workingHours;
    
    Object.entries(workHours).forEach(([day, hours]) => {
      if (hours) {
        // Create slots for each work day
        for (let hour = hours[0]; hour < hours[1]; hour += 0.5) {
          const slot: TimeSlot = {
            id: `${day}-${hour}`,
            start: new Date(2024, 0, 1, Math.floor(hour), (hour % 1) * 60),
            end: new Date(2024, 0, 1, Math.floor(hour + 0.5), ((hour + 0.5) % 1) * 60),
            duration: 30,
            isAvailable: true,
            quality: 0.8,
            availability: 1.0,
            suitability: 0.9,
            type: 'work'
          };
          slots.push(slot);
        }
      }
    });

    return slots;
  }

  private generateMeetingLink(meetingType: string): string {
    switch (meetingType) {
      case 'video':
        return `https://meet.motion.ai/room/${this.generateId()}`;
      case 'phone':
        return `tel:+1-555-MOTION`;
      default:
        return '';
    }
  }

  private sendConfirmationEmail(meeting: Meeting, bookingLink: BookingLink): void {
    // This would integrate with an email service
    console.log(`Sending confirmation email for meeting: ${meeting.title}`);
  }

  private generateSlug(name: string): string {
    return name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // Public getters
  getAllBookingLinks(): BookingLink[] {
    return Array.from(this.bookingLinks.values());
  }

  getBookingLink(id: string): BookingLink | undefined {
    return this.bookingLinks.get(id);
  }

  getAllMeetings(): Meeting[] {
    return Array.from(this.meetings.values());
  }

  updateExistingEvents(events: Event[]): void {
    this.existingEvents = events;
  }
}