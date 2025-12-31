import { useCallback, useEffect, useState } from 'react';
import {
  getInternshipPeriods,
  createInternshipPeriod,
  updateInternshipPeriod,
  deleteInternshipPeriod,
} from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { ResourceModal } from '../components/ResourceModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ErrorDialog } from '../components/ErrorDialog';
import { SuccessDialog } from '../components/SuccessDialog';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorState } from '../components/ErrorState';
import { Pagination } from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

export const InternshipPeriodsManager = () => {
  const { token } = useAuth();
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formState, setFormState] = useState({
    name: '',
    start_date: '',
    end_date: '',
    description: '',
    is_active: false,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getInternshipPeriods();
      setPeriods(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleOpenModal = (period = null) => {
    if (period) {
      setEditing(period);
      setFormState({
        name: period.name || '',
        start_date: period.start_date ? period.start_date.slice(0, 16) : '',
        end_date: period.end_date ? period.end_date.slice(0, 16) : '',
        description: period.description || '',
        is_active: period.is_active || false,
      });
    } else {
      setEditing(null);
      setFormState({
        name: '',
        start_date: '',
        end_date: '',
        description: '',
        is_active: false,
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditing(null);
    setFormState({
      name: '',
      start_date: '',
      end_date: '',
      description: '',
      is_active: false,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const data = {
        name: formState.name,
        start_date: formState.start_date,
        end_date: formState.end_date,
        description: formState.description || null,
        is_active: formState.is_active || false,
      };

      if (editing) {
        await updateInternshipPeriod(editing.id, data, token);
        setSuccessDialog({ 
          open: true, 
          message: 'Cập nhật đợt đăng ký thành công!'
        });
      } else {
        await createInternshipPeriod(data, token);
        setSuccessDialog({ 
          open: true, 
          message: 'Tạo đợt đăng ký thành công!'
        });
      }
      handleCloseModal();
      await loadData();
    } catch (err) {
      setErrorDialog({ 
        open: true, 
        message: err.message || err.error || 'Có lỗi xảy ra',
        error: err 
      });
    }
  };

  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const [errorDialog, setErrorDialog] = useState({ open: false, message: null });
  const [successDialog, setSuccessDialog] = useState({ open: false, message: null });

  const handleDelete = async (id) => {
    setDeleteConfirm({ open: true, id });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.id) {
      try {
        await deleteInternshipPeriod(deleteConfirm.id, token);
        setSuccessDialog({ 
          open: true, 
          message: 'Xóa đợt đăng ký thành công!'
        });
        await loadData();
      } catch (err) {
        setErrorDialog({ 
          open: true, 
          message: err.message || err.error || 'Có lỗi xảy ra',
          error: err 
        });
      }
    }
    setDeleteConfirm({ open: false, id: null });
  };

  const pagination = usePagination(periods, 10);

  if (loading && periods.length === 0) {
    return <LoadingSpinner />;
  }

  if (error && periods.length === 0) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Đợt Đăng ký Thực tập</h1>
          <p className="text-sm text-slate-600 mt-1">Quản lý các đợt đăng ký thực tập của sinh viên</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary-dark"
        >
          <FaPlus />
          <span>Thêm đợt đăng ký</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Tên đợt</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Thời gian bắt đầu</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Thời gian kết thúc</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Trạng thái</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {pagination.paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                    Chưa có đợt đăng ký nào
                  </td>
                </tr>
              ) : (
                pagination.paginatedItems.map((period) => (
                  <tr key={period.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{period.name}</p>
                      {period.description && (
                        <p className="text-sm text-slate-500 mt-1">{period.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {new Date(period.start_date).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {new Date(period.end_date).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-4 py-3">
                      {period.is_active ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                          Đang hoạt động
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-semibold">
                          Không hoạt động
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(period)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(period.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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

      {modalOpen && (
        <ResourceModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          title={editing ? 'Chỉnh sửa đợt đăng ký' : 'Thêm đợt đăng ký mới'}
          onSubmit={handleSubmit}
          editing={editing}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Tên đợt đăng ký <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formState.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                required
                placeholder="VD: Đợt 1 - Học kỳ 1 2025"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Thời gian bắt đầu <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={formState.start_date}
                onChange={(e) => handleChange('start_date', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Thời gian kết thúc <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={formState.end_date}
                onChange={(e) => handleChange('end_date', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Mô tả
              </label>
              <textarea
                value={formState.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="Mô tả về đợt đăng ký..."
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formState.is_active}
                onChange={(e) => handleChange('is_active', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded"
              />
              <label htmlFor="is_active" className="text-sm font-semibold text-slate-700">
                Đặt làm đợt đăng ký đang hoạt động
              </label>
            </div>
          </div>
        </ResourceModal>
      )}

      <ConfirmDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: null })}
        onConfirm={confirmDelete}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa đợt đăng ký này? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
      />

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

