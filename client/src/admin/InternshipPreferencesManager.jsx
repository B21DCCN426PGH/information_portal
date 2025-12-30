import { useCallback, useEffect, useState, useMemo } from 'react';
import {
  getInternshipPeriods,
  getAllRegistrations,
  updatePreferenceStatus,
  approveStudentToAcademy,
} from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorState } from '../components/ErrorState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { NotificationPopup } from '../components/NotificationPopup';
import { Pagination } from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import { FaCheck, FaTimes, FaTimesCircle, FaSearch } from 'react-icons/fa';
import { Modal } from '../components/Modal';

export const InternshipPreferencesManager = () => {
  const { token } = useAuth();
  const [periods, setPeriods] = useState([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null, preferenceId: null, studentId: null, periodId: null });
  const [notification, setNotification] = useState({ open: false, message: '', type: 'success' });
  const [notesFilter, setNotesFilter] = useState('all'); // 'all', 'with_notes', 'without_notes'
  const [searchQuery, setSearchQuery] = useState(''); // Tìm kiếm theo mã hoặc tên sinh viên

  const loadPeriods = useCallback(async () => {
    try {
      const data = await getInternshipPeriods();
      setPeriods(data);
      if (data.length > 0 && !selectedPeriodId) {
        const activePeriod = data.find(p => p.is_active) || data[0];
        setSelectedPeriodId(activePeriod.id);
      }
    } catch (err) {
      setError(err.message);
    }
  }, [selectedPeriodId]);

  const loadStudents = useCallback(async () => {
    if (!selectedPeriodId) return;

    try {
      setLoading(true);
      const data = await getAllRegistrations('preferences', selectedPeriodId, token);
      
      // Nhóm theo sinh viên và tạo danh sách sinh viên
      const grouped = {};
      data.forEach(pref => {
        const key = `${pref.student_id}_${pref.period_id}`;
        if (!grouped[key]) {
          grouped[key] = {
            student_id: pref.student_id,
            student_code: pref.student_code,
            student_name: pref.student_name,
            period_id: pref.period_id,
            period_name: pref.period_name,
            preferences: [],
          };
        }
        grouped[key].preferences.push(pref);
      });

      // Sắp xếp preferences theo thứ tự
      Object.values(grouped).forEach(group => {
        group.preferences.sort((a, b) => a.preference_order - b.preference_order);
      });

      // Chuyển thành danh sách sinh viên với thông tin tóm tắt
      const studentsList = Object.values(grouped).map(group => {
        // Lấy thời gian đăng ký sớm nhất từ các preferences
        const earliestRegisteredAt = group.preferences
          .map(p => p.registered_at)
          .filter(Boolean)
          .sort((a, b) => new Date(a) - new Date(b))[0] || null;
        
        // Lấy GPA từ preferences (nếu có)
        const studentGpa = group.preferences[0]?.student_gpa || 4.0;
        
        // Lấy notes từ preference đã duyệt (nếu có), hoặc lấy unique notes
        let notes = null;
        const approvedPreference = group.preferences.find(p => p.status === 'approved');
        if (approvedPreference && approvedPreference.notes) {
          notes = approvedPreference.notes;
        } else {
          // Nếu không có preference đã duyệt, lấy unique notes
          const uniqueNotes = [...new Set(group.preferences.map(p => p.notes).filter(Boolean))];
          if (uniqueNotes.length > 0) {
            notes = uniqueNotes[0]; // Chỉ lấy 1 ghi chú duy nhất
          }
        }
        
        return {
          student_id: group.student_id,
          student_code: group.student_code,
          student_name: group.student_name,
          student_gpa: studentGpa,
          notes: notes,
          period_id: group.period_id,
          period_name: group.period_name,
          total_preferences: group.preferences.length,
          approved_count: group.preferences.filter(p => p.status === 'approved').length,
          pending_count: group.preferences.filter(p => p.status === 'pending').length,
          rejected_count: group.preferences.filter(p => p.status === 'rejected').length,
          preferences: group.preferences, // Lưu toàn bộ preferences để hiển thị trong modal
          registered_at: earliestRegisteredAt, // Lưu thời gian đăng ký để sắp xếp
        };
      });

      // Sắp xếp danh sách sinh viên : GPA (cao đến thấp) -> thời gian đăng ký (sớm đến muộn)
      studentsList.sort((a, b) => {
        // GPA 
        const gpaA = a.student_gpa || 0;
        const gpaB = b.student_gpa || 0;
        if (gpaB !== gpaA) {
          return gpaB - gpaA;
        }
        
        // Thời gian đăng ký
        if (!a.registered_at && !b.registered_at) return 0;
        if (!a.registered_at) return 1; 
        if (!b.registered_at) return -1;
        return new Date(a.registered_at) - new Date(b.registered_at);
      });

      setStudents(studentsList);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriodId, token]);

  useEffect(() => {
    loadPeriods();
  }, [loadPeriods]);

  useEffect(() => {
    if (selectedPeriodId) {
      loadStudents();
    }
  }, [selectedPeriodId, loadStudents]);

  const handleOpenModal = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  const handleApprove = async (preferenceId, studentId, periodId) => {
    setConfirmDialog({ open: true, type: 'approve', preferenceId, studentId, periodId });
  };

  const handleApproveToAcademy = async (studentId, periodId) => {
    setConfirmDialog({ open: true, type: 'approve-academy', preferenceId: null, studentId, periodId });
  };

  const confirmApprove = async () => {
    // Nếu duyệt vào Học viện (không có preferenceId)
    if (confirmDialog.type === 'approve-academy') {
      try {
        setUpdating('academy');
        await approveStudentToAcademy({
          student_id: confirmDialog.studentId,
          period_id: confirmDialog.periodId
        }, token);

        setNotification({ open: true, message: 'Duyệt sinh viên vào Học viện thành công!', type: 'success' });
        
        // Reload danh sách sinh viên
        const data = await getAllRegistrations('preferences', selectedPeriodId, token);
        const grouped = {};
        data.forEach(pref => {
          const key = `${pref.student_id}_${pref.period_id}`;
          if (!grouped[key]) {
            grouped[key] = {
              student_id: pref.student_id,
              student_code: pref.student_code,
              student_name: pref.student_name,
              period_id: pref.period_id,
              period_name: pref.period_name,
              preferences: [],
            };
          }
          grouped[key].preferences.push(pref);
        });
        Object.values(grouped).forEach(group => {
          group.preferences.sort((a, b) => a.preference_order - b.preference_order);
        });
        const studentsList = Object.values(grouped).map(group => {
          const earliestRegisteredAt = group.preferences
            .map(p => p.registered_at)
            .filter(Boolean)
            .sort((a, b) => new Date(a) - new Date(b))[0] || null;
          
          let notes = null;
          const approvedPreference = group.preferences.find(p => p.status === 'approved');
          if (approvedPreference && approvedPreference.notes) {
            notes = approvedPreference.notes;
          } else {
            const uniqueNotes = [...new Set(group.preferences.map(p => p.notes).filter(Boolean))];
            if (uniqueNotes.length > 0) {
              notes = uniqueNotes[0];
            }
          }
          
          const studentGpa = group.preferences[0]?.student_gpa || 4.0;
          
          return {
            student_id: group.student_id,
            student_code: group.student_code,
            student_name: group.student_name,
            student_gpa: studentGpa,
            notes: notes,
            period_id: group.period_id,
            period_name: group.period_name,
            total_preferences: group.preferences.length,
            approved_count: group.preferences.filter(p => p.status === 'approved').length,
            pending_count: group.preferences.filter(p => p.status === 'pending').length,
            rejected_count: group.preferences.filter(p => p.status === 'rejected').length,
            preferences: group.preferences,
            registered_at: earliestRegisteredAt,
          };
        });
        
        studentsList.sort((a, b) => {
          if (!a.registered_at && !b.registered_at) return 0;
          if (!a.registered_at) return 1;
          if (!b.registered_at) return -1;
          return new Date(a.registered_at) - new Date(b.registered_at);
        });
        
        setStudents(studentsList);
        
        if (selectedStudent && selectedStudent.student_id === confirmDialog.studentId) {
          const updatedStudent = studentsList.find(s => s.student_id === confirmDialog.studentId);
          if (updatedStudent) {
            setSelectedStudent(updatedStudent);
          }
        }
      } catch (err) {
        setNotification({ open: true, message: err.message || 'Có lỗi xảy ra', type: 'error' });
      } finally {
        setUpdating(null);
        setConfirmDialog({ open: false, type: null, preferenceId: null, studentId: null, periodId: null });
      }
      return;
    }

    // Logic duyệt nguyện vọng bình thường
    if (confirmDialog.preferenceId) {
      try {
        setUpdating(confirmDialog.preferenceId);
        await updatePreferenceStatus(confirmDialog.preferenceId, { status: 'approved' }, token);
        setNotification({ open: true, message: 'Duyệt nguyện vọng thành công!', type: 'success' });
      
      // Reload danh sách sinh viên
      const data = await getAllRegistrations('preferences', selectedPeriodId, token);
      const grouped = {};
      data.forEach(pref => {
        const key = `${pref.student_id}_${pref.period_id}`;
        if (!grouped[key]) {
          grouped[key] = {
            student_id: pref.student_id,
            student_code: pref.student_code,
            student_name: pref.student_name,
            period_id: pref.period_id,
            period_name: pref.period_name,
            preferences: [],
          };
        }
        grouped[key].preferences.push(pref);
      });
      Object.values(grouped).forEach(group => {
        group.preferences.sort((a, b) => a.preference_order - b.preference_order);
      });
      const studentsList = Object.values(grouped).map(group => {
        const earliestRegisteredAt = group.preferences
          .map(p => p.registered_at)
          .filter(Boolean)
          .sort((a, b) => new Date(a) - new Date(b))[0] || null;
        
        // Lấy notes từ preference đã duyệt (nếu có), hoặc lấy unique notes
        let notes = null;
        const approvedPreference = group.preferences.find(p => p.status === 'approved');
        if (approvedPreference && approvedPreference.notes) {
          notes = approvedPreference.notes;
        } else {
          // Nếu không có preference đã duyệt, lấy unique notes
          const uniqueNotes = [...new Set(group.preferences.map(p => p.notes).filter(Boolean))];
          if (uniqueNotes.length > 0) {
            notes = uniqueNotes[0]; // Chỉ lấy 1 ghi chú duy nhất
          }
        }
        
        // Lấy GPA từ preferences (nếu có)
        const studentGpa = group.preferences[0]?.student_gpa || 4.0;
        
        return {
          student_id: group.student_id,
          student_code: group.student_code,
          student_name: group.student_name,
          student_gpa: studentGpa,
          notes: notes,
          period_id: group.period_id,
          period_name: group.period_name,
          total_preferences: group.preferences.length,
          approved_count: group.preferences.filter(p => p.status === 'approved').length,
          pending_count: group.preferences.filter(p => p.status === 'pending').length,
          rejected_count: group.preferences.filter(p => p.status === 'rejected').length,
          preferences: group.preferences,
          registered_at: earliestRegisteredAt,
        };
      });
      
      studentsList.sort((a, b) => {
        if (!a.registered_at && !b.registered_at) return 0;
        if (!a.registered_at) return 1;
        if (!b.registered_at) return -1;
        return new Date(a.registered_at) - new Date(b.registered_at);
      });
      
      setStudents(studentsList);
      
      // Cập nhật lại selectedStudent để modal hiển thị dữ liệu mới
      if (selectedStudent && selectedStudent.student_id === confirmDialog.studentId) {
        const updatedStudent = studentsList.find(s => s.student_id === confirmDialog.studentId);
        if (updatedStudent) {
          setSelectedStudent(updatedStudent);
        }
      }
      } catch (err) {
        setNotification({ open: true, message: err.message || 'Có lỗi xảy ra', type: 'error' });
      } finally {
        setUpdating(null);
        setConfirmDialog({ open: false, type: null, preferenceId: null, studentId: null, periodId: null });
      }
    }
  };

  const handleReject = async (preferenceId, studentId) => {
    setConfirmDialog({ open: true, type: 'reject', preferenceId, studentId, periodId: null });
  };

  const confirmReject = async () => {
    if (confirmDialog.preferenceId) {
      try {
      setUpdating(confirmDialog.preferenceId);
      await updatePreferenceStatus(confirmDialog.preferenceId, { status: 'rejected' }, token);
      setNotification({ open: true, message: 'Từ chối nguyện vọng thành công!', type: 'success' });
      
      // Reload danh sách sinh viên
      const data = await getAllRegistrations('preferences', selectedPeriodId, token);
      const grouped = {};
      data.forEach(pref => {
        const key = `${pref.student_id}_${pref.period_id}`;
        if (!grouped[key]) {
          grouped[key] = {
            student_id: pref.student_id,
            student_code: pref.student_code,
            student_name: pref.student_name,
            period_id: pref.period_id,
            period_name: pref.period_name,
            preferences: [],
          };
        }
        grouped[key].preferences.push(pref);
      });
      Object.values(grouped).forEach(group => {
        group.preferences.sort((a, b) => a.preference_order - b.preference_order);
      });
      const studentsList = Object.values(grouped).map(group => {
        const earliestRegisteredAt = group.preferences
          .map(p => p.registered_at)
          .filter(Boolean)
          .sort((a, b) => new Date(a) - new Date(b))[0] || null;
        
        // Lấy notes từ preference đã duyệt (nếu có), hoặc lấy unique notes
        let notes = null;
        const approvedPreference = group.preferences.find(p => p.status === 'approved');
        if (approvedPreference && approvedPreference.notes) {
          notes = approvedPreference.notes;
        } else {
          // Nếu không có preference đã duyệt, lấy unique notes
          const uniqueNotes = [...new Set(group.preferences.map(p => p.notes).filter(Boolean))];
          if (uniqueNotes.length > 0) {
            notes = uniqueNotes[0]; // Chỉ lấy 1 ghi chú duy nhất
          }
        }
        
        // Lấy GPA từ preferences (nếu có)
        const studentGpa = group.preferences[0]?.student_gpa || 4.0;
        
        return {
          student_id: group.student_id,
          student_code: group.student_code,
          student_name: group.student_name,
          student_gpa: studentGpa,
          notes: notes,
          period_id: group.period_id,
          period_name: group.period_name,
          total_preferences: group.preferences.length,
          approved_count: group.preferences.filter(p => p.status === 'approved').length,
          pending_count: group.preferences.filter(p => p.status === 'pending').length,
          rejected_count: group.preferences.filter(p => p.status === 'rejected').length,
          preferences: group.preferences,
          registered_at: earliestRegisteredAt,
        };
      });
      
      studentsList.sort((a, b) => {
        if (!a.registered_at && !b.registered_at) return 0;
        if (!a.registered_at) return 1;
        if (!b.registered_at) return -1;
        return new Date(a.registered_at) - new Date(b.registered_at);
      });
      
      setStudents(studentsList);
      
      // Cập nhật lại selectedStudent để modal hiển thị dữ liệu mới
      if (selectedStudent && selectedStudent.student_id === confirmDialog.studentId) {
        const updatedStudent = studentsList.find(s => s.student_id === confirmDialog.studentId);
        if (updatedStudent) {
          setSelectedStudent(updatedStudent);
        }
      }
      } catch (err) {
        setNotification({ open: true, message: err.message || 'Có lỗi xảy ra', type: 'error' });
      } finally {
        setUpdating(null);
        setConfirmDialog({ open: false, type: null, preferenceId: null, studentId: null, periodId: null });
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
            ✅ Đã duyệt
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">
            ❌ Từ chối
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
            ⏳ Chờ duyệt
          </span>
        );
    }
  };

  // Lọc sinh viên theo ghi chú và tìm kiếm
  const filteredStudents = useMemo(() => {
    let filtered = students;

    // Lọc theo ghi chú
    if (notesFilter === 'with_notes') {
      filtered = filtered.filter(s => s.notes && s.notes.trim() !== '');
    } else if (notesFilter === 'without_notes') {
      filtered = filtered.filter(s => !s.notes || s.notes.trim() === '');
    }

    // Tìm kiếm theo mã sinh viên hoặc tên
    if (searchQuery.trim() !== '') {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(s => {
        const codeMatch = s.student_code?.toLowerCase().includes(query);
        const nameMatch = s.student_name?.toLowerCase().includes(query);
        return codeMatch || nameMatch;
      });
    }

    return filtered;
  }, [students, notesFilter, searchQuery]);

  const pagination = usePagination(filteredStudents, 10);

  if (error && periods.length === 0) {
    return <ErrorState message={error} onRetry={loadPeriods} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Duyệt Đơn Đăng ký Nguyện vọng</h1>
          <p className="text-sm text-slate-600 mt-1">Duyệt đơn đăng ký nguyện vọng thực tập của sinh viên</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1 md:flex-none md:w-64">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Chọn đợt đăng ký
          </label>
          <select
            value={selectedPeriodId || ''}
            onChange={(e) => {
              setSelectedPeriodId(parseInt(e.target.value));
              setNotesFilter('all'); // Reset filter khi đổi đợt
              setSearchQuery(''); // Reset search khi đổi đợt
            }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
          >
            <option value="">-- Chọn đợt --</option>
            {periods.map((period) => (
              <option key={period.id} value={period.id}>
                {period.name} {period.is_active && '(Đang hoạt động)'}
              </option>
            ))}
          </select>
        </div>

        {selectedPeriodId && students.length > 0 && (
            <div className="flex-1 md:flex-none md:w-96">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Tìm kiếm
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo mã sinh viên hoặc tên..."
                  className="w-full px-4 py-2 pl-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          )}
            </div>

        {selectedPeriodId && students.length > 0 && (
          <>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Lọc theo ghi chú
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setNotesFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    notesFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Tất cả ({students.length})
                </button>
                <button
                  type="button"
                  onClick={() => setNotesFilter('with_notes')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    notesFilter === 'with_notes'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Có ghi chú ({students.filter(s => s.notes && s.notes.trim() !== '').length})
                </button>
                <button
                  type="button"
                  onClick={() => setNotesFilter('without_notes')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    notesFilter === 'without_notes'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Không có ghi chú ({students.filter(s => !s.notes || s.notes.trim() === '').length})
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {!selectedPeriodId ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-slate-600">Vui lòng chọn đợt đăng ký để xem danh sách sinh viên</p>
        </div>
      ) : loading ? (
        <LoadingSpinner />
      ) : students.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-slate-600">Chưa có sinh viên nào đăng ký trong đợt này</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-slate-600">
            {searchQuery.trim() !== '' 
              ? `Không tìm thấy sinh viên nào với từ khóa "${searchQuery}"`
              : notesFilter === 'with_notes' 
                ? 'Không có đơn nào có ghi chú' 
                : notesFilter === 'without_notes'
                  ? 'Không có đơn nào không có ghi chú'
                  : 'Không có kết quả'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Mã sinh viên</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Tên sinh viên</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">GPA</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Ghi chú</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pagination.paginatedItems.map((student) => (
                  <tr key={student.student_id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-900">{student.student_code}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-900">{student.student_name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-blue-600">
                        {(student.student_gpa || 4.0).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-600 max-w-xs truncate block" title={student.notes || ''}>
                        {student.notes || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {student.approved_count > 0 ? (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                          ✅ Đã duyệt
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
                          ⏳ Chưa duyệt
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleOpenModal(student)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold"
                      >
                        Xem nguyện vọng
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination.totalPages > 1 && (
            <div className="mt-4 px-4 pb-4">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={pagination.goToPage}
              />
            </div>
          )}
        </div>
      )}

      {/* Modal hiển thị nguyện vọng */}
      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        large={true}
        title={
          selectedStudent
            ? `Nguyện vọng đăng ký - ${selectedStudent.student_name} (${selectedStudent.student_code})`
            : 'Nguyện vọng đăng ký'
        }
      >
        {selectedStudent && (
          <div className="space-y-4">
            <div className="bg-slate-50 px-4 py-3 rounded-lg">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="whitespace-nowrap">
                  <p className="text-sm text-slate-600">Đợt đăng ký: <span className="font-semibold">{selectedStudent.period_name}</span></p>
                </div>
                <div className="whitespace-nowrap">
                  <p className="text-sm text-slate-600">GPA: <span className="font-semibold text-blue-600">{(selectedStudent.student_gpa || 4.0).toFixed(2)}</span></p>
                </div>
              </div>
              {selectedStudent.notes && (
                <div className="mt-2 pt-2 border-t border-slate-200">
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold">Ghi chú:</span> {selectedStudent.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase whitespace-nowrap">Thứ tự</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase whitespace-nowrap">Doanh nghiệp</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase whitespace-nowrap">Số slot còn hiện tại</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase whitespace-nowrap">Trạng thái</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase whitespace-nowrap">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selectedStudent.preferences.map((pref) => (
                    <tr key={pref.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-semibold text-sm">
                          {pref.preference_order}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-semibold text-slate-900">{pref.enterprise_name}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {pref.enterprise_available_slots !== null && pref.enterprise_available_slots !== undefined ? (
                          <span className={`px-3 py-1 rounded text-sm font-semibold ${
                            pref.enterprise_available_slots > 0 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {pref.enterprise_available_slots}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getStatusBadge(pref.status)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {pref.status === 'pending' ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApprove(pref.id, selectedStudent.student_id, selectedStudent.period_id)}
                              disabled={updating === pref.id}
                              className="p-2 text-green-600 hover:bg-green-50 rounded transition disabled:opacity-50"
                              title="Duyệt"
                            >
                              <FaCheck />
                            </button>
                            <button
                              onClick={() => handleReject(pref.id, selectedStudent.student_id)}
                              disabled={updating === pref.id}
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
                              title="Từ chối"
                            >
                              <FaTimes />
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Nút duyệt vào Học viện - chỉ hiển thị khi chưa có nguyện vọng nào được duyệt */}
            {selectedStudent.approved_count === 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-slate-800 block mb-1">
                      Sinh viên không đủ điều kiện thực tập tại doanh nghiệp bên ngoài
                    </span>
                    <p className="text-xs text-slate-600 mb-3">
                      Nếu sinh viên không đủ điều kiện, hãy click nút bên dưới để duyệt sinh viên vào Học viện Công nghệ Bưu chính Viễn thông. Tất cả nguyện vọng của sinh viên sẽ tự động bị từ chối.
                    </p>
                    <button
                      onClick={() => handleApproveToAcademy(selectedStudent.student_id, selectedStudent.period_id)}
                      disabled={updating === 'academy' || updating !== null}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <FaCheck />
                      {updating === 'academy' ? 'Đang duyệt...' : 'Duyệt vào Học viện Công nghệ Bưu chính Viễn thông'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {confirmDialog.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setConfirmDialog({ open: false, type: null, preferenceId: null, studentId: null, periodId: null });
            setInternAtAcademy(false);
          }
        }}>
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Xác nhận</h3>
              <p className="text-sm text-slate-600 mb-4">
                {confirmDialog.type === 'approve'
                  ? 'Bạn có chắc chắn muốn duyệt nguyện vọng này? Các nguyện vọng khác của sinh viên sẽ tự động bị từ chối.'
                  : 'Bạn có chắc chắn muốn từ chối nguyện vọng này?'}
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDialog({ open: false, type: null, preferenceId: null, studentId: null, periodId: null });
                  }}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirmDialog.type === 'approve' || confirmDialog.type === 'approve-academy') {
                      confirmApprove();
                    } else {
                      confirmReject();
                    }
                    setConfirmDialog({ open: false, type: null, preferenceId: null, studentId: null, periodId: null });
                  }}
                  className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition ${
                    confirmDialog.type === 'approve' || confirmDialog.type === 'approve-academy' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {confirmDialog.type === 'approve-academy' 
                    ? 'Duyệt vào Học viện' 
                    : confirmDialog.type === 'approve' 
                    ? 'Duyệt' 
                    : 'Từ chối'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <NotificationPopup
        open={notification.open}
        onClose={() => setNotification({ open: false, message: '', type: 'success' })}
        message={notification.message}
        type={notification.type}
      />
    </div>
  );
};
