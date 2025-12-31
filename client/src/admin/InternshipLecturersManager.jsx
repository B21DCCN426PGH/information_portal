import { useCallback, useEffect, useState } from 'react';
import {
  getInternshipPeriods,
  getInternshipLecturers,
  batchUpdateLecturerPeriods,
  fetchResource,
} from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorState } from '../components/ErrorState';
import { SuccessDialog } from '../components/SuccessDialog';
import { ErrorDialog } from '../components/ErrorDialog';
import { Pagination } from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import { FaSave } from 'react-icons/fa';

export const InternshipLecturersManager = () => {
  const { token } = useAuth();
  const [periods, setPeriods] = useState([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState(null);
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [localChanges, setLocalChanges] = useState({});
  const [successDialog, setSuccessDialog] = useState({ open: false, message: null });
  const [errorDialog, setErrorDialog] = useState({ open: false, message: null });

  const loadPeriods = useCallback(async () => {
    try {
      const data = await getInternshipPeriods();
      setPeriods(data);
      if (data.length > 0 && !selectedPeriodId) {
        // Tự động chọn đợt đang hoạt động hoặc đợt đầu tiên
        const activePeriod = data.find(p => p.is_active) || data[0];
        setSelectedPeriodId(activePeriod.id);
      }
    } catch (err) {
      setError(err.message);
    }
  }, [selectedPeriodId]);

  const loadLecturers = useCallback(async () => {
    if (!selectedPeriodId) return;

    try {
      setLoading(true);
      // Lấy tất cả giảng viên 
      const allLecturers = await fetchResource('lecturers');
      const periodLecturers = await getInternshipLecturers({ period_id: selectedPeriodId });

      // Merge dữ liệu
      const merged = allLecturers.map(lecturer => {
        const periodData = periodLecturers.find(pl => pl.id === lecturer.id);
        return {
          ...lecturer,
          period_id: selectedPeriodId,
          can_guide: periodData?.can_guide || false,
          max_slots: periodData?.max_slots || 10,
          current_slots: periodData?.current_slots || 0,
          available_slots: periodData ? (periodData.max_slots - periodData.current_slots) : 10,
        };
      });

      setLecturers(merged);
      setLocalChanges({});
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriodId]);

  useEffect(() => {
    loadPeriods();
  }, [loadPeriods]);

  useEffect(() => {
    if (selectedPeriodId) {
      loadLecturers();
    }
  }, [selectedPeriodId, loadLecturers]);

  const handleToggleCanGuide = (lecturerId) => {
    const lecturer = lecturers.find(l => l.id === lecturerId);
    const newValue = !lecturer.can_guide;
    
    setLocalChanges(prev => ({
      ...prev,
      [lecturerId]: {
        ...prev[lecturerId],
        can_guide: newValue,
      },
    }));

    setLecturers(prev =>
      prev.map(l =>
        l.id === lecturerId
          ? { ...l, can_guide: newValue }
          : l
      )
    );
  };

  const handleMaxSlotsChange = (lecturerId, value) => {
    const numValue = parseInt(value) || 0;
    
    setLocalChanges(prev => ({
      ...prev,
      [lecturerId]: {
        ...prev[lecturerId],
        max_slots: numValue,
      },
    }));

    setLecturers(prev =>
      prev.map(l =>
        l.id === lecturerId
          ? { ...l, max_slots: numValue }
          : l
      )
    );
  };

  const handleSave = async () => {
    if (!selectedPeriodId) return;

    // Chỉ gửi những giảng viên có thay đổi
    const updates = Object.keys(localChanges).map(lecturerId => {
      const lecturer = lecturers.find(l => l.id === parseInt(lecturerId));
      const changes = localChanges[lecturerId];
      return {
        lecturer_id: parseInt(lecturerId),
        can_guide: changes.can_guide !== undefined ? changes.can_guide : lecturer.can_guide,
        max_slots: changes.max_slots !== undefined ? changes.max_slots : lecturer.max_slots,
      };
    });

    if (updates.length === 0) {
      setErrorDialog({ 
        open: true, 
        message: 'Không có thay đổi nào để lưu'
      });
      return;
    }

    try {
      setSaving(true);
      await batchUpdateLecturerPeriods(
        {
          period_id: selectedPeriodId,
          lecturers: updates,
        },
        token
      );
      setSuccessDialog({ 
        open: true, 
        message: 'Lưu thành công!'
      });
      setLocalChanges({});
      await loadLecturers();
    } catch (err) {
      setErrorDialog({ 
        open: true, 
        message: err.message || err.error || 'Lỗi khi lưu',
        error: err 
      });
    } finally {
      setSaving(false);
    }
  };

  const pagination = usePagination(lecturers, 10);
  const hasChanges = Object.keys(localChanges).length > 0;

  if (error && periods.length === 0) {
    return <ErrorState message={error} onRetry={loadPeriods} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Giảng viên Hướng dẫn</h1>
          <p className="text-sm text-slate-600 mt-1">Cấu hình giảng viên hướng dẫn cho từng đợt đăng ký</p>
        </div>
        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
          >
            <FaSave />
            <span>{saving ? 'Đang lưu...' : 'Lưu'}</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Chọn đợt đăng ký
        </label>
        <select
          value={selectedPeriodId || ''}
          onChange={(e) => setSelectedPeriodId(parseInt(e.target.value))}
          className="w-full md:w-64 px-3 py-2 border border-slate-300 rounded-lg"
        >
          <option value="">-- Chọn đợt --</option>
          {periods.map((period) => (
            <option key={period.id} value={period.id}>
              {period.name} {period.is_active && '(Đang hoạt động)'}
            </option>
          ))}
        </select>
      </div>

      {!selectedPeriodId ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-slate-600">Vui lòng chọn đợt đăng ký để quản lý giảng viên</p>
        </div>
      ) : loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Mã giảng viên</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Tên giảng viên</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">SĐT</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Có thể hướng dẫn</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Số slot tối đa</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Slot đã dùng</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Slot còn lại</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pagination.paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-slate-500">
                      Không có giảng viên nào
                    </td>
                  </tr>
                ) : (
                  pagination.paginatedItems.map((lecturer) => {
                    const isChanged = localChanges[lecturer.id];
                    return (
                      <tr
                        key={lecturer.id}
                        className={`hover:bg-slate-50 ${isChanged ? 'bg-yellow-50' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-slate-700">
                            {lecturer.lecturer_code || '-'}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">
                            {lecturer.name}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{lecturer.email}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{lecturer.phone || '-'}</td>
                        <td className="px-4 py-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <div className="relative inline-flex items-center">
                              <input
                                type="checkbox"
                                checked={lecturer.can_guide}
                                onChange={() => handleToggleCanGuide(lecturer.id)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </div>
                            <span className="text-sm text-slate-700">
                              {lecturer.can_guide ? 'Có' : 'Không'}
                            </span>
                          </label>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            value={lecturer.max_slots}
                            onChange={(e) => handleMaxSlotsChange(lecturer.id, e.target.value)}
                            className="w-20 px-2 py-1 border border-slate-300 rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {lecturer.current_slots || 0}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-sm font-semibold ${
                              lecturer.available_slots > 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {lecturer.available_slots || 0}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
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

      <SuccessDialog
        open={successDialog.open}
        onClose={() => setSuccessDialog({ open: false, message: null })}
        message={successDialog.message}
      />

      <ErrorDialog
        open={errorDialog.open}
        onClose={() => setErrorDialog({ open: false, message: null })}
        message={errorDialog.message}
        error={errorDialog.error}
      />
    </div>
  );
};

