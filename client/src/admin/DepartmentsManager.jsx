import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchResource, createResource, updateResource, deleteResource } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { ResourceModal } from '../components/ResourceModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { SearchBar } from '../components/SearchBar';
import { Pagination } from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import { FaPlus, FaEdit, FaTrash, FaUserPlus, FaTimes } from 'react-icons/fa';
import apiClient from '../services/api';

const departmentConfig = {
  resource: 'departments',
  title: 'Quản lý Bộ môn',
  description: 'Quản lý các bộ môn và giảng viên trong từng bộ môn',
  columns: [
    { key: 'name', label: 'Tên bộ môn' },
    { key: 'description', label: 'Mô tả', render: (value) => value ? (value.length > 100 ? value.substring(0, 100) + '...' : value) : '-' },
  ],
  formFields: [
    { name: 'name', label: 'Tên bộ môn', required: true, placeholder: 'VD: Bộ môn Công nghệ Phần mềm' },
    { name: 'description', label: 'Giới thiệu bộ môn', type: 'textarea', fullWidth: true, rows: 6, placeholder: 'Nhập giới thiệu về bộ môn...' },
  ],
  modalTitle: { create: 'Thêm bộ môn', edit: 'Chỉnh sửa bộ môn' },
  modalDescription: 'Điền thông tin bộ môn',
  submitLabel: { create: 'Thêm bộ môn', edit: 'Lưu' },
};

export const DepartmentsManager = () => {
  const { token } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [allLecturers, setAllLecturers] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [departmentForm, setDepartmentForm] = useState({ name: '', description: '' });
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
  const [lecturerModalOpen, setLecturerModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [departmentQuery, setDepartmentQuery] = useState('');
  const [lecturerQuery, setLecturerQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: null, department: null, lecturerId: null });

  const handleSelectDepartment = useCallback(async (department) => {
    try {
      const response = await fetchResource('departments');
      const data = Array.isArray(response) ? response : (response?.data || response);
      const dept = data.find((d) => d.id === department.id);
      if (dept) {
        setSelectedDepartment(dept);
      }
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const loadDepartments = useCallback(async () => {
    try {
      const response = await fetchResource('departments');
      const data = Array.isArray(response) ? response : (response?.data || response);
      setDepartments(data || []);
      return data || [];
    } catch (err) {
      setError(err.message);
      return [];
    }
  }, []);

  const loadLecturers = useCallback(async () => {
    try {
      const response = await fetchResource('lecturers');
      const data = Array.isArray(response) ? response : (response?.data || response);
      setAllLecturers(data || []);
    } catch (err) {
      console.error('Error loading lecturers:', err);
    }
  }, []);

  const reloadDepartments = useCallback(
    async (preferredDepartment = null) => {
      const data = await loadDepartments();
      if (preferredDepartment) {
        await handleSelectDepartment(preferredDepartment);
        return;
      }
      if (data.length) {
        await handleSelectDepartment(data[0]);
      } else {
        setSelectedDepartment(null);
      }
    },
    [handleSelectDepartment, loadDepartments]
  );

  useEffect(() => {
    let ignore = false;
    (async () => {
      await loadLecturers();
      const data = await loadDepartments();
      if (!ignore && data.length) {
        await handleSelectDepartment(data[0]);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [handleSelectDepartment, loadDepartments, loadLecturers]);

  const handleOpenDepartmentModal = (department = null) => {
    if (department) {
      setEditingDepartment(department);
      setDepartmentForm({ name: department.name, description: department.description || '' });
    } else {
      setEditingDepartment(null);
      setDepartmentForm({ name: '', description: '' });
    }
    setDepartmentModalOpen(true);
  };

  const handleCloseDepartmentModal = () => {
    setDepartmentModalOpen(false);
    setEditingDepartment(null);
    setDepartmentForm({ name: '', description: '' });
  };

  const submitDepartment = async (event) => {
    event.preventDefault();
    try {
      setError(null);
      const submitData = { ...departmentForm };
      delete submitData.created_at;
      delete submitData.updated_at;
      delete submitData.id;
      delete submitData.lecturers;

      let targetDepartment = null;
      if (editingDepartment) {
        targetDepartment = await updateResource('departments', editingDepartment.id, submitData, token);
      } else {
        targetDepartment = await createResource('departments', submitData, token);
      }
      handleCloseDepartmentModal();
      await reloadDepartments(targetDepartment);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Có lỗi xảy ra');
    }
  };

  const handleDepartmentChange = (name, value) => {
    setDepartmentForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDepartmentDelete = async (department) => {
    setDeleteConfirm({ open: true, type: 'department', department, lecturerId: null });
  };

  const confirmDepartmentDelete = async () => {
    if (deleteConfirm.department) {
      try {
        await deleteResource('departments', deleteConfirm.department.id, token);
        if (selectedDepartment?.id === deleteConfirm.department.id) {
          setSelectedDepartment(null);
        }
        await reloadDepartments();
      } catch (err) {
        setError(err.message);
      }
    }
    setDeleteConfirm({ open: false, type: null, department: null, lecturerId: null });
  };

  const handleAddLecturer = () => {
    setLecturerModalOpen(true);
  };

  const handleAddLecturerSubmit = async (lecturerId) => {
    if (!selectedDepartment || !lecturerId) return;

    try {
      setError(null);
      await apiClient.post(`/departments/${selectedDepartment.id}/lecturers`, {
        lecturer_id: lecturerId,
      });

      setLecturerModalOpen(false);
      await loadLecturers(); // Reload lecturers to get updated department_id
      await handleSelectDepartment(selectedDepartment);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Không thể thêm giảng viên';
      setError(errorMessage);
      // Hiển thị alert nếu giảng viên đã thuộc bộ môn khác
      if (errorMessage.includes('đã thuộc bộ môn khác')) {
        alert(errorMessage);
      }
    }
  };

  const handleRemoveLecturer = async (lecturerId) => {
    setDeleteConfirm({ open: true, type: 'lecturer', department: null, lecturerId });
  };

  const confirmRemoveLecturer = async () => {
    if (deleteConfirm.lecturerId && selectedDepartment) {
      try {
        await apiClient.delete(`/departments/${selectedDepartment.id}/lecturers/${deleteConfirm.lecturerId}`);
        await handleSelectDepartment(selectedDepartment);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Không thể xóa giảng viên');
      }
    }
    setDeleteConfirm({ open: false, type: null, department: null, lecturerId: null });
  };

  const filteredDepartments = useMemo(() => {
    if (!departmentQuery) return departments;
    const lower = departmentQuery.toLowerCase();
    return departments.filter(
      (dept) =>
        dept.name?.toLowerCase().includes(lower) ||
        dept.description?.toLowerCase().includes(lower)
    );
  }, [departments, departmentQuery]);

      // hiển thị giảng viên chưa có bộ môn hoặc đang ở bộ môn hiện tại
  const getAvailableLecturers = () => {
    if (!selectedDepartment) return allLecturers;
    return allLecturers.filter((l) => !l.department_id || l.department_id === selectedDepartment.id);
  };

  const filteredLecturers = useMemo(() => {
    if (!selectedDepartment?.lecturers) return [];
    if (!lecturerQuery) return selectedDepartment.lecturers;
    const lower = lecturerQuery.toLowerCase();
    return selectedDepartment.lecturers.filter(
      (lecturer) =>
        lecturer.name?.toLowerCase().includes(lower) ||
        lecturer.email?.toLowerCase().includes(lower)
    );
  }, [selectedDepartment, lecturerQuery]);

  const lecturerPagination = usePagination(filteredLecturers, 10);

  useEffect(() => {
    if (lecturerPagination) lecturerPagination.reset();
  }, [lecturerQuery]); 

  return (
    <div className="space-y-8">
      <div className="grid gap-4 lg:grid-cols-4">
        <aside className="lg:col-span-1 rounded-xl border border-slate-100 p-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-slate-900">Bộ môn</h3>
            <button
              type="button"
              onClick={() => handleOpenDepartmentModal()}
              className="flex items-center gap-1 rounded-lg bg-primary px-2 py-1 text-xs font-semibold text-white hover:bg-primary-dark transition"
            >
              <FaPlus className="text-xs" />
              Thêm
            </button>
          </div>
          <div className="mb-3">
            <SearchBar
              value={departmentQuery}
              onChange={setDepartmentQuery}
              placeholder="Tìm kiếm bộ môn..."
            />
          </div>
          <ul className="mt-3 space-y-1.5">
            {filteredDepartments.map((department) => (
              <li
                key={department.id}
                onClick={() => handleSelectDepartment(department)}
                className={`rounded-lg border bg-white p-2 cursor-pointer transition hover:shadow-md ${selectedDepartment?.id === department.id ? 'border-primary' : 'border-slate-100'}`}
              >
                <div className="text-sm font-semibold text-slate-800">
                  {department.name}
                </div>
                <div className="mt-1.5 flex gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDepartmentModal(department);
                    }}
                    className="flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary hover:bg-primary/20 transition"
                  >
                    <FaEdit className="text-xs" />
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDepartmentDelete(department);
                    }}
                    className="flex items-center gap-1 rounded bg-red-50 px-1.5 py-0.5 text-xs font-semibold text-red-500 hover:bg-red-100 transition"
                  >
                    <FaTrash className="text-xs" />
                    Xóa
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </aside>
        <section className="lg:col-span-3 space-y-6">
          {selectedDepartment && (
            <div className="rounded-2xl border border-slate-100 p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Giảng viên — {selectedDepartment.name}
                  </h3>
                  <p className="text-sm text-slate-500">Quản lý giảng viên trong bộ môn.</p>
                </div>
                {getAvailableLecturers().length > 0 && (
                  <button
                    type="button"
                    onClick={handleAddLecturer}
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition"
                  >
                    <FaUserPlus />
                    Thêm giảng viên
                  </button>
                )}
              </div>
              <div className="mb-4">
                <SearchBar
                  value={lecturerQuery}
                  onChange={setLecturerQuery}
                  placeholder="Tìm kiếm giảng viên theo tên, email..."
                />
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Mã giảng viên</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Tên</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Điện thoại</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Học vị</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Học hàm</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-600">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {lecturerPagination.paginatedItems.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-4 py-8 text-center text-sm text-slate-500">
                          {lecturerQuery ? 'Không tìm thấy kết quả' : 'Chưa có giảng viên'}
                        </td>
                      </tr>
                    ) : (
                      lecturerPagination.paginatedItems.map((lecturer) => (
                        <tr key={lecturer.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm text-slate-700 font-medium">{lecturer.lecturer_code || '-'}</td>
                          <td className="px-4 py-3 text-sm text-slate-700 font-semibold">{lecturer.name}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{lecturer.email}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{lecturer.phone || '-'}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{lecturer.academic_degree || '-'}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{lecturer.academic_rank || ' - '}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleRemoveLecturer(lecturer.id)}
                                className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                                title="Xóa"
                              >
                                <FaTimes />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {lecturerPagination.totalPages > 1 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={lecturerPagination.currentPage}
                    totalPages={lecturerPagination.totalPages}
                    onPageChange={lecturerPagination.goToPage}
                  />
                </div>
              )}
            </div>
          )}
        </section>
      </div>
      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

      {/* Department Modal */}
      <ResourceModal
        open={departmentModalOpen}
        onClose={handleCloseDepartmentModal}
        onSubmit={submitDepartment}
        formData={departmentForm}
        onChange={handleDepartmentChange}
        editing={editingDepartment}
        config={departmentConfig}
      />

      {lecturerModalOpen && selectedDepartment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 rounded-t-2xl">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Thêm giảng viên</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Chọn giảng viên để thêm vào {selectedDepartment.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLecturerModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {getAvailableLecturers().length > 0 ? (
                  getAvailableLecturers().map((lecturer) => (
                    <button
                      key={lecturer.id}
                      type="button"
                      onClick={() => handleAddLecturerSubmit(lecturer.id)}
                      className="w-full text-left rounded-lg border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50 transition"
                    >
                      <p className="font-semibold text-slate-900">{lecturer.name}</p>
                      <p className="text-sm text-slate-500">{lecturer.email}</p>
                      {lecturer.phone && (
                        <p className="text-xs text-slate-400 mt-1">{lecturer.phone}</p>
                      )}
                      {lecturer.department_id && lecturer.department_id === selectedDepartment.id && (
                        <p className="text-xs text-blue-600 mt-1 font-semibold">(Đã thuộc bộ môn này)</p>
                      )}
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 text-center py-8">
                    Tất cả giảng viên đã được thêm vào bộ môn này
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, type: null, department: null, lecturerId: null })}
        onConfirm={deleteConfirm.type === 'department' ? confirmDepartmentDelete : confirmRemoveLecturer}
        title="Xác nhận xóa"
        message={
          deleteConfirm.type === 'department'
            ? 'Xóa bộ môn này?'
            : 'Xóa giảng viên khỏi bộ môn này?'
        }
        confirmText="Xóa"
        cancelText="Hủy"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
};
