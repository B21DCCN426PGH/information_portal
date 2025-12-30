import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createResource,
  deleteResource,
  fetchResource,
  updateResource,
} from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { ResourceModal } from '../components/ResourceModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { SearchBar } from '../components/SearchBar';
import { Pagination } from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

export const ResourceManager = ({ config }) => {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formState, setFormState] = useState({});
  const [query, setQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, item: null });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchResource(config.resource);
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [config.resource]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditing(item);
      const allowedFields = new Set(config.formFields.map((field) => field.name));
      const formData = {};
      
      Object.keys(item).forEach((key) => {
        if (allowedFields.has(key)) {
          if (key === 'academic_rank' && (item[key] === null || item[key] === undefined)) {
            formData[key] = '';
          } else if (key === 'event_time' && item[key]) {
            // Chuyển đổi format event_time từ "HH:MM:SS" hoặc "HH:MM" sang "HH:MM" cho input type="time"
            const timeValue = item[key];
            if (typeof timeValue === 'string') {
              // Nếu có format "HH:MM:SS", chỉ lấy "HH:MM"
              formData[key] = timeValue.substring(0, 5);
            } else {
              formData[key] = timeValue;
            }
          } else {
            // Kiểm tra xem field này có phải là date field không
            const fieldConfig = config.formFields.find(f => f.name === key);
            if (fieldConfig && fieldConfig.type === 'date' && item[key]) {
              // Chuyển đổi format date từ database (ISO string hoặc datetime string) sang "YYYY-MM-DD" cho input type="date"
              // QUAN TRỌNG: Chỉ parse string trực tiếp, KHÔNG dùng Date object để tránh lệch timezone
              const dateValue = item[key];
              
              // Xử lý Date object trước (có thể MySQL driver trả về Date object)
              if (dateValue instanceof Date) {
                // Sử dụng UTC methods để tránh timezone issues
                const year = dateValue.getUTCFullYear();
                const month = String(dateValue.getUTCMonth() + 1).padStart(2, '0');
                const day = String(dateValue.getUTCDate()).padStart(2, '0');
                formData[key] = `${year}-${month}-${day}`;
              } else if (typeof dateValue === 'string') {
                // Xử lý các format khác nhau:
                // - ISO format với Z: "2024-09-02T17:00:00.000Z" -> parse như UTC -> "2024-09-02"
                // - MySQL datetime: "2024-09-02 00:00:00" -> "2024-09-02"
                // - Date string: "2024-09-02" -> "2024-09-02"
                let dateStr = '';
                if (dateValue.includes('T') && dateValue.includes('Z')) {
                  // ISO format với Z (UTC): cần parse như UTC để lấy đúng date
                  // Ví dụ: "2003-05-10T17:00:00.000Z" (UTC) = "2003-05-11 00:00:00" (UTC+7)
                  // Nhưng database lưu "2003-05-11 00:00:00", nên ta cần parse UTC và lấy date
                  try {
                    const dateObj = new Date(dateValue);
                    // Sử dụng UTC methods để lấy date từ UTC string
                    const year = dateObj.getUTCFullYear();
                    const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
                    const day = String(dateObj.getUTCDate()).padStart(2, '0');
                    dateStr = `${year}-${month}-${day}`;
                  } catch (e) {
                    // Fallback: lấy phần trước 'T'
                    dateStr = dateValue.split('T')[0];
                  }
                } else if (dateValue.includes('T')) {
                  // ISO format không có Z: lấy phần trước 'T'
                  dateStr = dateValue.split('T')[0];
                } else if (dateValue.includes(' ')) {
                  // MySQL datetime: lấy phần trước khoảng trắng
                  dateStr = dateValue.split(' ')[0];
                } else if (dateValue.match(/^\d{4}-\d{2}-\d{2}/)) {
                  // Đã là format YYYY-MM-DD
                  dateStr = dateValue;
                } else {
                  // Fallback: giữ nguyên
                  dateStr = dateValue;
                }
                // Đảm bảo format đúng YYYY-MM-DD
                if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                  formData[key] = dateStr;
                } else {
                  // Nếu không đúng format, thử parse lại
                  console.warn(`Invalid date format for ${key}:`, dateValue);
                  formData[key] = item[key];
                }
              } else {
                // Fallback cho các kiểu khác
                formData[key] = item[key];
              }
          } else {
            formData[key] = item[key];
            }
          }
        }
      });
      
      setFormState(formData);
    } else {
      setEditing(null);
      setFormState({});
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditing(null);
    setFormState({});
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      // chỉ gửi các trường được định nghĩa trong config.formFields
      const allowedFields = new Set(config.formFields.map((field) => field.name));
      // cũng cho phép id và created_at cho cập nhật (nếu tồn tại)
      if (editing) {
        allowedFields.add('id');
        allowedFields.add('created_at');
      }
      
      const cleanFormData = {};
      Object.keys(formState).forEach((key) => {
        if (allowedFields.has(key)) {
          cleanFormData[key] = formState[key];
        }
      });
      
      if (editing) {
        await updateResource(config.resource, editing.id, cleanFormData, token);
      } else {
        await createResource(config.resource, cleanFormData, token);
      }
      handleCloseModal();
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (item) => {
    setDeleteConfirm({ open: true, item });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.item) {
      try {
        setError(null);
        await deleteResource(config.resource, deleteConfirm.item.id, token);
        await loadData();
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message || `Không thể xóa ${config.title.toLowerCase()}. Có thể bản ghi này đang được sử dụng ở nơi khác.`;
        setError(errorMessage);
        console.error(`Error deleting ${config.resource}:`, err);
      }
    }
    setDeleteConfirm({ open: false, item: null });
  };

  const filteredItems = useMemo(() => {
    if (!query) return items;
    const lower = query.toLowerCase();
    return items.filter((item) => {
      // Search in all column values
      return config.columns.some((column) => {
        const value = item[column.key];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(lower);
      });
    });
  }, [items, query, config.columns]);

  const pagination = usePagination(filteredItems, 10);

  useEffect(() => {
    if (pagination) pagination.reset();
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">{config.title}</h2>
          <p className="text-sm text-slate-500">{config.description}</p>
        </div>
        <button
          type="button"
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary-dark"
        >
          <FaPlus />
          Thêm mới
        </button>
      </div>
      <div className="mb-4">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder={`Tìm kiếm ${config.title.toLowerCase()}...`}
        />
      </div>
      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-slate-500">Đang tải...</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  {config.columns.map((column) => (
                    <th
                      key={column.key}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600"
                    >
                      {column.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-600">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pagination.paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={config.columns.length + 1} className="px-4 py-8 text-center text-sm text-slate-500">
                      {query ? 'Không tìm thấy kết quả' : 'Chưa có dữ liệu'}
                    </td>
                  </tr>
                ) : (
                  pagination.paginatedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      {config.columns.map((column) => {
                        const value = item[column.key];
                        // Auto-detect image fields and render as image
                        const isImageField = column.key === 'image_url' || column.key === 'cover_image' || column.key === 'logo_url';
                        const renderValue = () => {
                          if (column.render) {
                            return column.render(value, item);
                          }
                          if (isImageField && value) {
                            return (
                              <div className="flex items-center gap-2">
                                <img
                                  src={value}
                                  alt={item.title || item.name || 'Image'}
                                  className="h-12 w-12 rounded-lg object-cover border border-slate-200"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    const fallback = e.target.parentElement.querySelector('.image-fallback');
                                    if (fallback) {
                                      fallback.style.display = 'inline';
                                    }
                                  }}
                                />
                                <span className="image-fallback hidden text-xs text-slate-400">Lỗi tải ảnh</span>
                              </div>
                            );
                          }
                          // academic_rank có thể null, hiển thị " - " nếu null
                          if (column.key === 'academic_rank') {
                            return value || ' - ';
                          }
                          return value || '-';
                        };
                        return (
                          <td key={column.key} className="px-4 py-3 text-sm text-slate-700">
                            {renderValue()}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenModal(item)}
                            className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                            title="Chỉnh sửa"
                          >
                            <FaEdit />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                            title="Xóa"
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
            <div className="mt-4">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={pagination.goToPage}
              />
            </div>
          )}
        </>
      )}

      <ResourceModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        formData={formState}
        onChange={handleChange}
        editing={editing}
        config={config}
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, item: null })}
        onConfirm={confirmDelete}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa bản ghi này?"
        confirmText="Xóa"
        cancelText="Hủy"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
};

