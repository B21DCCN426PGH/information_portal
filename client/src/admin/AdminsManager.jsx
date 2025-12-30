import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchAdmins, createAdmin, deleteAdmin } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { SearchBar } from '../components/SearchBar';
import { Pagination } from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import { FaPlus, FaTrash, FaUserShield, FaUser } from 'react-icons/fa';
import { formatDate } from '../utils/dateFormat';

export const AdminsManager = () => {
  const { token, profile } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formState, setFormState] = useState({ name: '', email: '', password: '', role: 'admin' });
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, name: null });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchAdmins(token);
      setAdmins(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách admin');
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredAdmins = useMemo(() => {
    if (!query.trim()) return admins;
    const lowerQuery = query.toLowerCase();
    return admins.filter((admin) =>
      admin.name?.toLowerCase().includes(lowerQuery) ||
      admin.email?.toLowerCase().includes(lowerQuery) ||
      admin.role?.toLowerCase().includes(lowerQuery)
    );
  }, [admins, query]);

  const { currentPage, totalPages, paginatedItems, goToPage } = usePagination(filteredAdmins, 10);

  const handleCreate = () => {
    setFormState({ name: '', email: '', password: '', role: 'admin' });
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      if (!formState.name || !formState.email || !formState.password) {
        setError('Vui lòng điền đầy đủ thông tin');
        return;
      }

      if (formState.password.length < 6) {
        setError('Mật khẩu phải có ít nhất 6 ký tự');
        return;
      }

      await createAdmin(formState, token);
      setModalOpen(false);
      setFormState({ name: '', email: '', password: '', role: 'admin' });
      await loadData();
    } catch (err) {
      setError(err.message || 'Không thể tạo admin');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (admin) => {
    setDeleteConfirm({ open: true, id: admin.id, name: admin.name });
  };

  const confirmDelete = async () => {
    try {
      await deleteAdmin(deleteConfirm.id, token);
      setDeleteConfirm({ open: false, id: null, name: null });
      await loadData();
    } catch (err) {
      setError(err.message || 'Không thể xóa admin');
      setDeleteConfirm({ open: false, id: null, name: null });
    }
  };

  // Kiểm tra xem user hiện tại có phải super-admin không
  const isSuperAdmin = profile?.role === 'super-admin';

  // Debug: Log để kiểm tra
  useEffect(() => {
    console.log('Current profile:', profile);
    console.log('Is super admin:', isSuperAdmin);
  }, [profile, isSuperAdmin]);

  if (!isSuperAdmin) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-800">Chỉ super-admin mới có quyền truy cập trang này.</p>
        <p className="mt-2 text-sm text-red-600">Role hiện tại: {profile?.role || 'Không có'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Admin</h1>
          <p className="mt-1 text-sm text-slate-500">Quản lý tài khoản quản trị viên hệ thống.</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90"
        >
          <FaPlus /> Thêm Admin
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>
      )}

      <SearchBar query={query} onQueryChange={setQuery} placeholder="Tìm kiếm theo tên, email, role..." />

      {loading ? (
        <p className="text-slate-500">Đang tải...</p>
      ) : filteredAdmins.length === 0 ? (
        <p className="text-slate-500">Không có admin nào.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-700">Tên</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-700">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-700">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-700">Ngày tạo</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-slate-700">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginatedItems.map((admin) => (
                  <tr key={admin.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {admin.role === 'super-admin' ? (
                          <FaUserShield className="text-purple-600" />
                        ) : (
                          <FaUser className="text-slate-400" />
                        )}
                        <span className="font-medium text-slate-900">{admin.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{admin.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          admin.role === 'super-admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {admin.role === 'super-admin' ? 'Super Admin' : 'Admin'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(admin.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      {admin.id !== profile?.id ? (
                        <button
                          onClick={() => handleDelete(admin)}
                          className="text-red-600 hover:text-red-800"
                          title="Xóa admin"
                        >
                          <FaTrash />
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Tài khoản của bạn</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} />
        </>
      )}

      {/* Modal tạo admin */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Thêm Admin Mới</h2>
              <button
                onClick={() => {
                  setModalOpen(false);
                  setError(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Tên *</label>
                <input
                  type="text"
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Email *</label>
                <input
                  type="email"
                  value={formState.email}
                  onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Mật khẩu *</label>
                <input
                  type="password"
                  value={formState.password}
                  onChange={(e) => setFormState({ ...formState, password: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  required
                  minLength={6}
                />
                <p className="mt-1 text-xs text-slate-500">Tối thiểu 6 ký tự</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Role *</label>
                <select
                  value={formState.role}
                  onChange={(e) => setFormState({ ...formState, role: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  required
                >
                  <option value="admin">Admin</option>
                  <option value="super-admin">Super Admin</option>
                </select>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setError(null);
                  }}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting ? 'Đang tạo...' : 'Tạo Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={deleteConfirm.open}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa admin "${deleteConfirm.name}"? Hành động này không thể hoàn tác.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ open: false, id: null, name: null })}
      />
    </div>
  );
};

