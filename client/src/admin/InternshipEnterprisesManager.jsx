import { useCallback, useEffect, useState } from 'react';
import {
  getInternshipPeriods,
  getPeriodEnterprises,
  createPeriodEnterprise,
  updatePeriodEnterprise,
  deletePeriodEnterprise,
  bulkDeletePeriodEnterprises,
  downloadPeriodEnterprisesTemplate,
  importPeriodEnterprises,
} from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { ResourceModal } from '../components/ResourceModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorState } from '../components/ErrorState';
import { Pagination } from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import { FaPlus, FaEdit, FaTrash, FaFileExcel, FaDownload, FaUpload, FaTimes } from 'react-icons/fa';

export const InternshipEnterprisesManager = () => {
  const { token } = useAuth();
  const [periods, setPeriods] = useState([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState(null);
  const [enterprises, setEnterprises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [formState, setFormState] = useState({
    name: '',
    job_description: '',
    address: '',
    contact_info: '',
    max_slots: 10,
    is_active: true,
  });

  const loadPeriods = useCallback(async () => {
    try {
      const data = await getInternshipPeriods();
      setPeriods(data);
      // Tự động chọn đợt đang hoạt động hoặc đợt đầu tiên
      if (data.length > 0 && !selectedPeriodId) {
        const activePeriod = data.find(p => p.is_active) || data[0];
        setSelectedPeriodId(activePeriod.id);
      }
    } catch (err) {
      console.error('Error loading periods:', err);
    }
  }, [selectedPeriodId]);

  // Load danh sách doanh nghiệp theo đợt
  const loadEnterprises = useCallback(async () => {
    if (!selectedPeriodId) return;
    try {
      setLoading(true);
      const data = await getPeriodEnterprises({ period_id: selectedPeriodId });
      setEnterprises(data);
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
    loadEnterprises();
  }, [loadEnterprises]);

  const handleChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleOpenModal = (enterprise = null) => {
    if (enterprise) {
      setEditing(enterprise);
      setFormState({
        name: enterprise.name || '',
        job_description: enterprise.job_description || '',
        address: enterprise.address || '',
        contact_info: enterprise.contact_info || '',
        max_slots: enterprise.max_slots || 10,
        is_active: enterprise.is_active !== undefined ? enterprise.is_active : true,
      });
    } else {
      setEditing(null);
      setFormState({
        name: '',
        job_description: '',
        address: '',
        contact_info: '',
        max_slots: 10,
        is_active: true,
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditing(null);
    setFormState({
      name: '',
      job_description: '',
      address: '',
      contact_info: '',
      max_slots: 10,
      is_active: true,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedPeriodId) {
      alert('Vui lòng chọn đợt đăng ký');
      return;
    }
    try {
      const data = {
        period_id: selectedPeriodId,
        name: formState.name,
        job_description: formState.job_description || null,
        address: formState.address || null,
        contact_info: formState.contact_info || null,
        max_slots: formState.max_slots || 10,
        is_active: formState.is_active !== undefined ? formState.is_active : true,
      };

      if (editing) {
        await updatePeriodEnterprise(editing.id, data, token);
      } else {
        await createPeriodEnterprise(data, token);
      }
      handleCloseModal();
      await loadEnterprises();
    } catch (err) {
      alert(err.message || 'Có lỗi xảy ra');
    }
  };

  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, bulk: false });

  const handleDelete = async (id) => {
    setDeleteConfirm({ open: true, id, bulk: false });
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) {
      alert('Vui lòng chọn ít nhất một doanh nghiệp để xóa');
      return;
    }
    setDeleteConfirm({ open: true, id: null, bulk: true });
  };

  const confirmDelete = async () => {
    try {
      if (deleteConfirm.bulk) {
        await bulkDeletePeriodEnterprises(selectedIds, token);
        setSelectedIds([]);
        await loadEnterprises();
      } else if (deleteConfirm.id) {
        await deletePeriodEnterprise(deleteConfirm.id, token);
        await loadEnterprises();
      }
    } catch (err) {
      alert(err.message || 'Có lỗi xảy ra');
    }
    setDeleteConfirm({ open: false, id: null, bulk: false });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      // Chọn tất cả doanh nghiệp trong tất cả các trang
      setSelectedIds(enterprises.map(e => e.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id, checked) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(i => i !== id));
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await downloadPeriodEnterprisesTemplate(token);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'template_doanh_nghiep.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert(err.message || 'Lỗi khi tải template');
    }
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (ext !== 'xlsx' && ext !== 'xls') {
        alert('Vui lòng chọn file Excel (.xlsx hoặc .xls)');
        return;
      }
      setImportFile(file);
    }
  };

  const handleImportSubmit = async () => {
    if (!importFile) {
      setError('Vui lòng chọn file Excel');
      return;
    }
    if (!selectedPeriodId) {
      setError('Vui lòng chọn đợt đăng ký');
      return;
    }
    try {
      setImporting(true);
      setError(null);
      const response = await importPeriodEnterprises(importFile, selectedPeriodId, token);
      // Response có thể là response.data hoặc response trực tiếp
      const result = response.data || response;
      console.log('Import result:', result);
      setImportResult(result);
      await loadEnterprises();
    } catch (err) {
      console.error('Import error:', err);
      // Hiển thị lỗi dưới dạng kết quả import thất bại
      setImportResult({
        message: err.message || 'Lỗi khi import Excel',
        success: 0,
        failed: 1,
        errors: [err.message || 'Lỗi không xác định']
      });
      setError(null);
    } finally {
      setImporting(false);
    }
  };

  const pagination = usePagination(enterprises, 10);

  if (loading && enterprises.length === 0) {
    return <LoadingSpinner />;
  }

  if (error && enterprises.length === 0 && selectedPeriodId) {
    return <ErrorState message={error} onRetry={loadEnterprises} />;
  }

  if (!selectedPeriodId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Quản lý Doanh nghiệp Thực tập</h1>
            <p className="text-sm text-slate-600 mt-1">Quản lý danh sách doanh nghiệp nhận sinh viên thực tập theo từng đợt</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Chọn đợt đăng ký <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedPeriodId || ''}
            onChange={(e) => setSelectedPeriodId(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">-- Chọn đợt đăng ký --</option>
            {periods.map((period) => (
              <option key={period.id} value={period.id}>
                {period.name} {period.is_active ? '(Đang hoạt động)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Doanh nghiệp Thực tập</h1>
          <p className="text-sm text-slate-600 mt-1">Quản lý danh sách doanh nghiệp nhận sinh viên thực tập theo từng đợt</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-green-700"
          >
            <FaDownload />
            <span>Tải template</span>
          </button>
          <button
            onClick={() => setImportModalOpen(true)}
            disabled={!selectedPeriodId}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            <FaUpload />
            <span>Import Excel</span>
          </button>
          <button
            onClick={() => handleOpenModal()}
            disabled={!selectedPeriodId}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary-dark disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            <FaPlus />
            <span>Thêm doanh nghiệp</span>
          </button>
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-700"
            >
              <FaTrash />
              <span>Xóa ({selectedIds.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* chọn đợt đăng ký */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Chọn đợt đăng ký <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedPeriodId || ''}
          onChange={(e) => setSelectedPeriodId(e.target.value ? parseInt(e.target.value) : null)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">-- Chọn đợt đăng ký --</option>
          {periods.map((period) => (
            <option key={period.id} value={period.id}>
              {period.name} {period.is_active ? '(Đang hoạt động)' : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                  <input
                    type="checkbox"
                    checked={enterprises.length > 0 && enterprises.every(e => selectedIds.includes(e.id))}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Tên doanh nghiệp</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Mô tả công việc</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Địa chỉ</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Thông tin liên hệ</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Slot tối đa (đợt này)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Slot đã dùng (đợt này)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Trạng thái</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {pagination.paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-slate-500">
                    Chưa có doanh nghiệp nào
                  </td>
                </tr>
              ) : (
                pagination.paginatedItems.map((enterprise) => (
                  <tr key={enterprise.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(enterprise.id)}
                        onChange={(e) => handleSelectOne(enterprise.id, e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{enterprise.name}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-xs">
                      {enterprise.job_description ? (
                        <p className="truncate" title={enterprise.job_description}>
                          {enterprise.job_description}
                        </p>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {enterprise.address || <span className="text-slate-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {enterprise.contact_info || <span className="text-slate-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {enterprise.max_slots || 10}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-semibold ${
                        (enterprise.current_slots || 0) >= (enterprise.max_slots || 10)
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}>
                        {enterprise.current_slots || 0} / {enterprise.max_slots || 10}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {enterprise.is_active ? (
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
                          onClick={() => handleOpenModal(enterprise)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(enterprise.id)}
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
          title={editing ? 'Chỉnh sửa doanh nghiệp trong đợt' : 'Thêm doanh nghiệp vào đợt'}
          onSubmit={handleSubmit}
          editing={editing}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Tên doanh nghiệp <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formState.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                required
                placeholder="Nhập tên doanh nghiệp"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Mô tả công việc
              </label>
              <textarea
                value={formState.job_description}
                onChange={(e) => handleChange('job_description', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                rows="3"
                placeholder="Mô tả công việc thực tập..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Địa chỉ
              </label>
              <input
                type="text"
                value={formState.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="Nhập địa chỉ"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Thông tin liên hệ
              </label>
              <input
                type="text"
                value={formState.contact_info}
                onChange={(e) => handleChange('contact_info', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="Email hoặc số điện thoại"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Số slot tối đa cho đợt này <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formState.max_slots}
                onChange={(e) => handleChange('max_slots', parseInt(e.target.value) || 10)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                required
                placeholder="10"
              />
              <p className="text-xs text-slate-500 mt-1">Số lượng sinh viên tối đa mà doanh nghiệp có thể nhận trong đợt này</p>
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
                Đang nhận sinh viên thực tập trong đợt này
              </label>
            </div>
          </div>
        </ResourceModal>
      )}

      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 rounded-t-2xl">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Import doanh nghiệp từ Excel</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Upload file Excel (.xlsx, .xls) để import nhiều doanh nghiệp cùng lúc
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setImportModalOpen(false);
                  setImportFile(null);
                  setImportResult(null);
                  setError(null);
                }}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {!importResult ? (
                <>
                  <div className="rounded-lg border-2 border-dashed border-slate-300 p-8 text-center">
                    <FaFileExcel className="mx-auto mb-4 text-4xl text-slate-400" />
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleImportFile}
                        className="hidden"
                      />
                      <div className="text-sm text-slate-600">
                        {importFile ? (
                          <span className="font-semibold text-green-600">{importFile.name}</span>
                        ) : (
                          <>
                            <span className="font-semibold text-primary">Chọn file Excel</span> hoặc kéo thả vào đây
                          </>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        Chỉ chấp nhận file .xlsx hoặc .xls
                      </p>
                    </label>
                  </div>

                  {importFile && (
                    <div className="rounded-lg bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-700 mb-2">File đã chọn:</p>
                      <p className="text-sm text-slate-600">{importFile.name}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {(importFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  )}

                  {error && (
                    <div className="rounded-lg bg-red-50 p-4 border border-red-200">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}

                  <div className="rounded-lg bg-blue-50 p-4">
                    <p className="text-sm font-semibold text-blue-900 mb-2">Định dạng file Excel:</p>
                    <p className="text-xs text-blue-800 mb-1">
                      File Excel cần có các cột sau (dòng đầu tiên là tiêu đề):
                    </p>
                    <ul className="text-xs text-blue-800 list-disc list-inside space-y-1">
                      <li><strong>Tên doanh nghiệp</strong> - Bắt buộc, tối đa 200 ký tự</li>
                      <li><strong>Mô tả công việc</strong> - Tùy chọn, mô tả công việc thực tập</li>
                      <li><strong>Địa chỉ</strong> - Tùy chọn, tối đa 255 ký tự</li>
                      <li><strong>Thông tin liên hệ</strong> - Tùy chọn, email hoặc số điện thoại, tối đa 255 ký tự</li>
                      <li><strong>Số slot tối đa</strong> - Tùy chọn, số nguyên dương (1-1000), mặc định 10</li>
                      <li><strong>Đang hoạt động</strong> - Tùy chọn, "Có" hoặc "Không", mặc định "Có"</li>
                    </ul>
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                    >
                      Tải template mẫu
                    </button>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setImportModalOpen(false);
                        setImportFile(null);
                        setError(null);
                      }}
                      className="rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleImportSubmit}
                      disabled={!importFile || importing}
                      className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {importing ? 'Đang import...' : 'Import'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className={`rounded-lg p-4 border ${
                    importResult.failed === 0 
                      ? 'bg-green-50 border-green-200' 
                      : importResult.success > 0 
                        ? 'bg-yellow-50 border-yellow-200' 
                        : 'bg-red-50 border-red-200'
                  }`}>
                    <p className={`text-sm font-semibold ${
                      importResult.failed === 0 
                        ? 'text-green-900' 
                        : importResult.success > 0 
                          ? 'text-yellow-900' 
                          : 'text-red-900'
                    }`}>
                      {importResult.message}
                    </p>
                    <p className="text-xs mt-2 text-slate-600">
                      Thành công: {importResult.success} | Thất bại: {importResult.failed}
                    </p>
                  </div>

                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="rounded-lg border border-red-200 bg-red-50 max-h-64 overflow-y-auto">
                      <p className="text-sm font-semibold text-red-900 p-4 border-b border-red-200">
                        Chi tiết lỗi ({importResult.errors.length}):
                      </p>
                      <div className="p-4 space-y-2">
                        {importResult.errors.slice(0, 20).map((err, idx) => (
                          <div key={idx} className="text-xs text-red-800">
                            {err}
                          </div>
                        ))}
                        {importResult.errors.length > 20 && (
                          <p className="text-xs text-red-600 italic">
                            ... và {importResult.errors.length - 20} lỗi khác
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setImportModalOpen(false);
                        setImportFile(null);
                        setImportResult(null);
                        setError(null);
                      }}
                      className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: null, bulk: false })}
        onConfirm={confirmDelete}
        title="Xác nhận xóa"
        message={
          deleteConfirm.bulk
            ? `Bạn có chắc chắn muốn xóa ${selectedIds.length} doanh nghiệp đã chọn?`
            : 'Bạn có chắc chắn muốn xóa doanh nghiệp này?'
        }
        confirmText="Xóa"
        cancelText="Hủy"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
};

