import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Link, Settings, Plus, Copy, Check } from 'lucide-react';
import { MeetingScheduler as MeetingSchedulerClass } from '../../lib/meeting-scheduler';
import { UserSchedule } from '../../lib/types';

interface BookingLink {
  id: string;
  name: string;
  description: string;
  duration: number;
  bufferBefore: number;
  bufferAfter: number;
  meetingType: 'video' | 'phone' | 'in-person';
  maxMeetingsPerDay: number;
  isActive: boolean;
  slug: string;
  createdAt: Date;
}

interface Meeting {
  id: string;
  title: string;
  attendeeName: string;
  attendeeEmail: string;
  startTime: Date;
  endTime: Date;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
  meetingLink?: string;
}

interface MeetingSchedulerProps {
  userSchedule: UserSchedule;
  onMeetingBooked: (meeting: Meeting) => void;
}

const MeetingSchedulerComponent: React.FC<MeetingSchedulerProps> = ({
  userSchedule,
  onMeetingBooked
}) => {
  const [scheduler] = useState(() => new MeetingSchedulerClass(userSchedule));
  const [bookingLinks, setBookingLinks] = useState<BookingLink[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [showCreateLink, setShowCreateLink] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  useEffect(() => {
    const links = scheduler.getAllBookingLinks();
    const allMeetings = scheduler.getAllMeetings();
    setBookingLinks(links);
    setMeetings(allMeetings);
  }, [scheduler]);

  const handleCreateBookingLink = (linkData: {
    name: string;
    description: string;
    duration: number;
    bufferBefore: number;
    bufferAfter: number;
    meetingType: 'video' | 'phone' | 'in-person';
    maxMeetingsPerDay: number;
  }) => {
    const newLink = scheduler.createBookingLink(linkData);
    setBookingLinks(prev => [...prev, newLink]);
    setShowCreateLink(false);
  };

  const copyBookingLink = async (link: BookingLink) => {
    const url = `${window.location.origin}/book/${link.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLinkId(link.id);
      setTimeout(() => setCopiedLinkId(null), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const getUpcomingMeetings = (): Meeting[] => {
    const now = new Date();
    return meetings
      .filter(meeting => meeting.startTime > now && meeting.status !== 'cancelled')
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
      .slice(0, 5);
  };

  const getTodaysMeetings = (): Meeting[] => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    return meetings.filter(meeting => 
      meeting.startTime >= startOfDay && 
      meeting.startTime < endOfDay &&
      meeting.status !== 'cancelled'
    ).sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  };

  return (
    <div className="meeting-scheduler">
      {/* Header */}
      <div className="scheduler-header">
        <div className="header-content">
          <h2>Meeting Scheduler</h2>
          <p>Create booking links and manage your meetings with intelligent scheduling</p>
        </div>
        <button
          onClick={() => setShowCreateLink(true)}
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4" />
          Create Booking Link
        </button>
      </div>

      {/* Stats Overview */}
      <div className="scheduler-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <Link className="h-5 w-5 text-blue-600" />
          </div>
          <div className="stat-content">
            <div className="stat-value">{bookingLinks.filter(l => l.isActive).length}</div>
            <div className="stat-label">Active Links</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <Calendar className="h-5 w-5 text-green-600" />
          </div>
          <div className="stat-content">
            <div className="stat-value">{getTodaysMeetings().length}</div>
            <div className="stat-label">Today's Meetings</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <Clock className="h-5 w-5 text-orange-600" />
          </div>
          <div className="stat-content">
            <div className="stat-value">{getUpcomingMeetings().length}</div>
            <div className="stat-label">Upcoming</div>
          </div>
        </div>
      </div>

      <div className="scheduler-content">
        {/* Booking Links */}
        <div className="booking-links-section">
          <h3>Booking Links</h3>
          
          {bookingLinks.length === 0 ? (
            <div className="empty-state">
              <Link className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4>No booking links yet</h4>
              <p>Create your first booking link to start accepting meetings</p>
              <button
                onClick={() => setShowCreateLink(true)}
                className="btn btn-primary"
              >
                <Plus className="h-4 w-4" />
                Create Booking Link
              </button>
            </div>
          ) : (
            <div className="booking-links-grid">
              {bookingLinks.map(link => (
                <div key={link.id} className="booking-link-card">
                  <div className="link-header">
                    <div className="link-info">
                      <h4>{link.name}</h4>
                      <p>{link.description}</p>
                    </div>
                    <div className="link-status">
                      <span className={`status-badge ${link.isActive ? 'active' : 'inactive'}`}>
                        {link.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="link-details">
                    <div className="detail-item">
                      <Clock className="h-4 w-4" />
                      <span>{formatDuration(link.duration)}</span>
                    </div>
                    <div className="detail-item">
                      <Users className="h-4 w-4" />
                      <span>{link.meetingType}</span>
                    </div>
                    <div className="detail-item">
                      <Calendar className="h-4 w-4" />
                      <span>Max {link.maxMeetingsPerDay}/day</span>
                    </div>
                  </div>

                  <div className="buffer-info">
                    <span className="buffer-label">Buffers:</span>
                    <span>{link.bufferBefore}m before, {link.bufferAfter}m after</span>
                  </div>

                  <div className="link-actions">
                    <button
                      onClick={() => copyBookingLink(link)}
                      className="btn btn-sm btn-outline"
                    >
                      {copiedLinkId === link.id ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy Link
                        </>
                      )}
                    </button>
                    <button className="btn btn-sm btn-outline">
                      <Settings className="h-4 w-4" />
                      Settings
                    </button>
                  </div>

                  <div className="booking-url">
                    <code>/book/{link.slug}</code>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Meetings */}
        {getTodaysMeetings().length > 0 && (
          <div className="todays-meetings-section">
            <h3>Today's Meetings</h3>
            <div className="meetings-list">
              {getTodaysMeetings().map(meeting => (
                <div key={meeting.id} className="meeting-item">
                  <div className="meeting-time">
                    <div className="time-start">
                      {meeting.startTime.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                    <div className="time-end">
                      {meeting.endTime.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                  
                  <div className="meeting-content">
                    <div className="meeting-title">{meeting.title}</div>
                    <div className="meeting-attendee">
                      with {meeting.attendeeName} ({meeting.attendeeEmail})
                    </div>
                  </div>
                  
                  <div className="meeting-actions">
                    <span className={`status-badge status-${meeting.status}`}>
                      {meeting.status}
                    </span>
                    {meeting.meetingLink && (
                      <a 
                        href={meeting.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-primary"
                      >
                        Join
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Meetings */}
        {getUpcomingMeetings().length > 0 && (
          <div className="upcoming-meetings-section">
            <h3>Upcoming Meetings</h3>
            <div className="meetings-list">
              {getUpcomingMeetings().map(meeting => (
                <div key={meeting.id} className="meeting-item">
                  <div className="meeting-date">
                    <div className="date-day">
                      {meeting.startTime.toLocaleDateString([], { 
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="date-time">
                      {meeting.startTime.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                  
                  <div className="meeting-content">
                    <div className="meeting-title">{meeting.title}</div>
                    <div className="meeting-attendee">
                      with {meeting.attendeeName}
                    </div>
                  </div>
                  
                  <div className="meeting-actions">
                    <span className={`status-badge status-${meeting.status}`}>
                      {meeting.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Booking Link Modal */}
      {showCreateLink && (
        <CreateBookingLinkModal
          onClose={() => setShowCreateLink(false)}
          onCreate={handleCreateBookingLink}
        />
      )}
    </div>
  );
};

// Create Booking Link Modal
const CreateBookingLinkModal: React.FC<{
  onClose: () => void;
  onCreate: (data: any) => void;
}> = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 30,
    bufferBefore: 15,
    bufferAfter: 15,
    meetingType: 'video' as 'video' | 'phone' | 'in-person',
    maxMeetingsPerDay: 8
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create Booking Link</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Meeting Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g., Parent Interview, Student Consultation"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="What is this meeting for?"
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Duration (minutes)</label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>

            <div className="form-group">
              <label>Meeting Type</label>
              <select
                value={formData.meetingType}
                onChange={(e) => setFormData({...formData, meetingType: e.target.value as any})}
              >
                <option value="video">Video Call</option>
                <option value="phone">Phone Call</option>
                <option value="in-person">In Person</option>
              </select>
            </div>
          </div>

          <div className="form-section">
            <h4>Buffer Times</h4>
            <p className="form-help">
              Buffer times prevent back-to-back meetings and give you time to prepare
            </p>
            
            <div className="form-row">
              <div className="form-group">
                <label>Buffer Before (minutes)</label>
                <input
                  type="number"
                  value={formData.bufferBefore}
                  onChange={(e) => setFormData({...formData, bufferBefore: parseInt(e.target.value)})}
                  min="0"
                  max="60"
                />
              </div>

              <div className="form-group">
                <label>Buffer After (minutes)</label>
                <input
                  type="number"
                  value={formData.bufferAfter}
                  onChange={(e) => setFormData({...formData, bufferAfter: parseInt(e.target.value)})}
                  min="0"
                  max="60"
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Max Meetings Per Day</label>
            <input
              type="number"
              value={formData.maxMeetingsPerDay}
              onChange={(e) => setFormData({...formData, maxMeetingsPerDay: parseInt(e.target.value)})}
              min="1"
              max="20"
            />
            <small className="form-help">
              Limit the number of meetings that can be booked in a single day
            </small>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Booking Link
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MeetingSchedulerComponent;