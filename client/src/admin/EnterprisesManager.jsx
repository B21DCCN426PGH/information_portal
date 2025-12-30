import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createResource,
  deleteResource,
  fetchResource,
  updateResource,
} from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { EnterpriseModal } from '../components/EnterpriseModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { SearchBar } from '../components/SearchBar';
import { Pagination } from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import { FaPlus, FaEdit, FaTrash, FaExternalLinkAlt } from 'react-icons/fa';

export const EnterprisesManager = () => {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({});
  const [query, setQuery] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchResource('enterprises');
      setItems(data);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditing(item);
      setFormData(item);
    } else {
      setEditing(null);
      setFormData({});
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditing(null);
    setFormData({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateResource('enterprises', editing.id, formData, token);
      } else {
        await createResource('enterprises', formData, token);
      }
      handleCloseModal();
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, item: null });

  const handleDelete = async (item) => {
    setDeleteConfirm({ open: true, item });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.item) {
      try {
        setError(null);
        await deleteResource('enterprises', deleteConfirm.item.id, token);
        await loadData();
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message || 'Không thể xóa doanh nghiệp. Có thể doanh nghiệp này đang được sử dụng ở nơi khác.';
        setError(errorMessage);
        console.error('Error deleting enterprise:', err);
      }
    }
    setDeleteConfirm({ open: false, item: null });
  };

  const filteredItems = useMemo(() => {
    if (!query) return items;
    const lower = query.toLowerCase();
    return items.filter(
      (item) =>
        item.name?.toLowerCase().includes(lower) ||
        item.industry?.toLowerCase().includes(lower) ||
        item.description?.toLowerCase().includes(lower) ||
        item.address?.toLowerCase().includes(lower)
    );
  }, [items, query]);

  const pagination = usePagination(filteredItems, 10);

  useEffect(() => {
    if (pagination) pagination.reset();
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Quản lý Doanh nghiệp</h2>
          <p className="text-sm text-slate-500">Quản lý các doanh nghiệp đối tác</p>
        </div>
        <button
          type="button"
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary-dark"
        >
          <FaPlus />
          Thêm doanh nghiệp
        </button>
      </div>

      <div className="mb-4">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Tìm kiếm theo tên, ngành, loại hợp tác..."
        />
      </div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-slate-500">
          {filteredItems.length} {filteredItems.length === 1 ? 'doanh nghiệp' : 'doanh nghiệp'}
        </span>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-slate-500">Đang tải...</p>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pagination.paginatedItems.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-lg"
            >
              {/* Action Buttons */}
              <div className="absolute right-4 top-4 flex gap-2 opacity-0 transition group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => handleOpenModal(item)}
                  className="rounded-lg bg-primary/10 p-2 text-primary hover:bg-primary/20 transition"
                  aria-label="Sửa"
                >
                  <FaEdit className="text-sm" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item)}
                  className="rounded-lg bg-red-50 p-2 text-red-500 hover:bg-red-100 transition"
                  aria-label="Xóa"
                >
                  <FaTrash className="text-sm" />
                </button>
              </div>

              {/* Logo */}
              <div className="mb-4 flex h-20 items-center justify-center rounded-xl bg-slate-50">
                {item.logo_url ? (
                  <img
                    src={item.logo_url}
                    alt={item.name}
                    className="max-h-16 max-w-full object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) {
                        e.target.nextSibling.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <div
                  className={`${item.logo_url ? 'hidden' : 'flex'} h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-primary`}
                >
                  <span className="text-2xl font-bold">{item.name?.charAt(0) || 'N'}</span>
                </div>
              </div>


              {/* Company Name */}
              <h3 className="text-lg font-semibold text-slate-900">{item.name}</h3>

              {/* Description */}
              <p className="mt-2 line-clamp-3 text-sm text-slate-600">{item.description}</p>

              {/* Website Link */}
              {item.website && (
                <a
                  href={item.website}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-dark transition"
                >
                  Website
                  <FaExternalLinkAlt className="text-xs" />
                </a>
              )}
            </div>
          ))}
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

      <EnterpriseModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        formData={formData}
        onChange={handleChange}
        editing={editing}
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, item: null })}
        onConfirm={confirmDelete}
        title="Xác nhận xóa"
        message="Xóa doanh nghiệp này?"
        confirmText="Xóa"
        cancelText="Hủy"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
};

