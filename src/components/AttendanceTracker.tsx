import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, Clock, User, Download, Filter } from 'lucide-react';
import { db } from '../../lib/database';

interface AttendanceRecord {
  id: string;
  studentId: string;
  date: Date;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  arrivedAt?: string;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
}

interface AttendanceTrackerProps {
  userId: string;
}

const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({ userId }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [userId, selectedDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [studentData, attendanceData] = await Promise.all([
        db.getStudents(userId),
        db.getAttendanceByDate(userId, selectedDate)
      ]);
      setStudents(studentData);
      setAttendance(attendanceData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = async (
    studentId: string,
    status: AttendanceRecord['status']
  ) => {
    try {
      const existing = attendance.find(
        a => a.studentId === studentId &&
        a.date.toDateString() === selectedDate.toDateString()
      );

      if (existing) {
        const updated = { ...existing, status };
        await db.updateAttendance(existing.id, updated);
        setAttendance(attendance.map(a => a.id === existing.id ? updated : a));
      } else {
        const newRecord: Omit<AttendanceRecord, 'id'> = {
          studentId,
          date: selectedDate,
          status,
          arrivedAt: status === 'late' ? new Date().toLocaleTimeString() : undefined
        };
        const created = await db.createAttendance(userId, newRecord);
        setAttendance([...attendance, created]);
      }
    } catch (error) {
      console.error('Failed to update attendance:', error);
      alert('Failed to update attendance. Please try again.');
    }
  };

  const getAttendanceStatus = (studentId: string): AttendanceRecord['status'] | null => {
    const record = attendance.find(
      a => a.studentId === studentId &&
      a.date.toDateString() === selectedDate.toDateString()
    );
    return record?.status || null;
  };

  const getStatusColor = (status: AttendanceRecord['status'] | null) => {
    switch (status) {
      case 'present':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
      case 'absent':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
      case 'late':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300';
      case 'excused':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'text-gray-400 bg-gray-100 dark:bg-slate-700 dark:text-gray-500';
    }
  };

  const getStatusIcon = (status: AttendanceRecord['status'] | null) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4" />;
      case 'absent':
        return <XCircle className="h-4 w-4" />;
      case 'late':
        return <Clock className="h-4 w-4" />;
      case 'excused':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getTodayStats = () => {
    const todayAttendance = attendance.filter(
      a => a.date.toDateString() === selectedDate.toDateString()
    );

    return {
      present: todayAttendance.filter(a => a.status === 'present').length,
      absent: todayAttendance.filter(a => a.status === 'absent').length,
      late: todayAttendance.filter(a => a.status === 'late').length,
      excused: todayAttendance.filter(a => a.status === 'excused').length,
      total: students.length
    };
  };

  const stats = getTodayStats();
  const attendanceRate = students.length > 0
    ? ((stats.present + stats.late) / students.length * 100).toFixed(1)
    : 0;

  if (loading) {
    return (
      <div className="card p-8 text-center">
        <div className="loading-spinner mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Loading attendance...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="card-title flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Attendance Tracker
              </h3>
              <p className="card-subtitle">
                Track daily student attendance
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="form-input"
              />
              <button className="btn btn-secondary flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        <div className="card-content">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="stat-card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {students.length}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Total Students</div>
            </div>

            <div className="stat-card bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.present}
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">Present</div>
            </div>

            <div className="stat-card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.absent}
              </div>
              <div className="text-sm text-red-600 dark:text-red-400">Absent</div>
            </div>

            <div className="stat-card bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.late}
              </div>
              <div className="text-sm text-yellow-600 dark:text-yellow-400">Late</div>
            </div>

            <div className="stat-card bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <div className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                {attendanceRate}%
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Attendance Rate</div>
            </div>
          </div>

          {students.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Students Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Add students to your roster to start tracking attendance.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Mark Attendance
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {students.map((student) => {
                    const status = getAttendanceStatus(student.id);
                    return (
                      <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium">
                              {student.firstName[0]}{student.lastName[0]}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {student.firstName} {student.lastName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {student.studentId}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {status && (
                            <span className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1 w-fit ${getStatusColor(status)}`}>
                              {getStatusIcon(status)}
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleAttendanceChange(student.id, 'present')}
                              className={`p-2 rounded-lg transition-colors ${
                                status === 'present'
                                  ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                                  : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                              }`}
                              title="Present"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleAttendanceChange(student.id, 'late')}
                              className={`p-2 rounded-lg transition-colors ${
                                status === 'late'
                                  ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400'
                                  : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                              }`}
                              title="Late"
                            >
                              <Clock className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleAttendanceChange(student.id, 'absent')}
                              className={`p-2 rounded-lg transition-colors ${
                                status === 'absent'
                                  ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
                                  : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                              }`}
                              title="Absent"
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleAttendanceChange(student.id, 'excused')}
                              className={`p-2 rounded-lg transition-colors ${
                                status === 'excused'
                                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                                  : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                              }`}
                              title="Excused"
                            >
                              <User className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceTracker;
