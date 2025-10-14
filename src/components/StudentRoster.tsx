import React, { useState, useEffect } from 'react';
import { Users, Plus, Mail, Phone, Edit2, Trash2, Search, Filter, Download } from 'lucide-react';
import { db } from '../../lib/database';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  grade: string;
  studentId: string;
  notes?: string;
  createdAt: Date;
}

interface StudentRosterProps {
  userId: string;
}

const StudentRoster: React.FC<StudentRosterProps> = ({ userId }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');

  useEffect(() => {
    loadStudents();
  }, [userId]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const studentData = await db.getStudents(userId);
      setStudents(studentData);
    } catch (error) {
      console.error('Failed to load students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (studentData: Omit<Student, 'id' | 'createdAt'>) => {
    try {
      const newStudent = await db.createStudent(userId, studentData);
      setStudents([...students, newStudent]);
      setShowAddModal(false);
    } catch (error) {
      console.error('Failed to add student:', error);
      alert('Failed to add student. Please try again.');
    }
  };

  const handleUpdateStudent = async (student: Student) => {
    try {
      await db.updateStudent(student.id, student);
      setStudents(students.map(s => s.id === student.id ? student : s));
      setEditingStudent(null);
    } catch (error) {
      console.error('Failed to update student:', error);
      alert('Failed to update student. Please try again.');
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to remove this student?')) return;

    try {
      await db.deleteStudent(studentId);
      setStudents(students.filter(s => s.id !== studentId));
    } catch (error) {
      console.error('Failed to delete student:', error);
      alert('Failed to delete student. Please try again.');
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = searchQuery === '' ||
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGrade = gradeFilter === 'all' || student.grade === gradeFilter;

    return matchesSearch && matchesGrade;
  });

  const grades = Array.from(new Set(students.map(s => s.grade))).sort();

  if (loading) {
    return (
      <div className="card p-8 text-center">
        <div className="loading-spinner mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Loading students...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="card-title flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Student Roster
              </h3>
              <p className="card-subtitle">
                Manage your students and contact information
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Student
            </button>
          </div>
        </div>

        <div className="card-content">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or student ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="form-select"
              >
                <option value="all">All Grades</option>
                {grades.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
              <button className="btn btn-secondary flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {students.length === 0 ? 'No Students Yet' : 'No Matches Found'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {students.length === 0
                  ? 'Add your first student to get started.'
                  : 'Try adjusting your search or filter.'}
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
                      Grade
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Parent/Guardian
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {filteredStudents.map((student) => (
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
                            {student.email && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {student.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {student.studentId}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                          {student.grade}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {student.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {student.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {student.parentName && (
                          <div className="text-sm">
                            <div className="text-gray-900 dark:text-white">{student.parentName}</div>
                            {student.parentEmail && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {student.parentEmail}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingStudent(student)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(student.id)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {(showAddModal || editingStudent) && (
        <StudentFormModal
          student={editingStudent}
          onClose={() => {
            setShowAddModal(false);
            setEditingStudent(null);
          }}
          onSave={(student) => {
            if (editingStudent) {
              handleUpdateStudent(student as Student);
            } else {
              handleAddStudent(student);
            }
          }}
        />
      )}
    </div>
  );
};

const StudentFormModal: React.FC<{
  student: Student | null;
  onClose: () => void;
  onSave: (student: Omit<Student, 'id' | 'createdAt'> | Student) => void;
}> = ({ student, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    firstName: student?.firstName || '',
    lastName: student?.lastName || '',
    email: student?.email || '',
    phone: student?.phone || '',
    parentName: student?.parentName || '',
    parentEmail: student?.parentEmail || '',
    parentPhone: student?.parentPhone || '',
    grade: student?.grade || '',
    studentId: student?.studentId || '',
    notes: student?.notes || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (student) {
      onSave({ ...student, ...formData });
    } else {
      onSave(formData);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{student ? 'Edit Student' : 'Add Student'}</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Student ID *</label>
              <input
                type="text"
                value={formData.studentId}
                onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Grade *</label>
              <input
                type="text"
                value={formData.grade}
                onChange={(e) => setFormData({...formData, grade: e.target.value})}
                className="form-input"
                placeholder="e.g., 10th Grade, Year 11"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Student Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Student Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="form-input"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-slate-700 pt-4 mt-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Parent/Guardian Information</h4>

            <div className="form-group">
              <label className="form-label">Parent/Guardian Name</label>
              <input
                type="text"
                value={formData.parentName}
                onChange={(e) => setFormData({...formData, parentName: e.target.value})}
                className="form-input"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Parent Email</label>
                <input
                  type="email"
                  value={formData.parentEmail}
                  onChange={(e) => setFormData({...formData, parentEmail: e.target.value})}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Parent Phone</label>
                <input
                  type="tel"
                  value={formData.parentPhone}
                  onChange={(e) => setFormData({...formData, parentPhone: e.target.value})}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="form-textarea"
              rows={3}
              placeholder="Additional notes about the student..."
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {student ? 'Save Changes' : 'Add Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentRoster;
