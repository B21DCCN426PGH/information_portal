import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createCourse,
  createResource,
  deleteCourse,
  deleteResource,
  fetchMajorWithCourses,
  fetchResource,
  updateCourse,
  updateResource,
  downloadCoursesTemplate,
  importCoursesFromExcel,
} from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { MajorModal } from '../components/MajorModal';
import { CourseModal } from '../components/CourseModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { SearchBar } from '../components/SearchBar';
import { Pagination } from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import { FaPlus, FaEdit, FaTrash, FaFileExcel, FaDownload, FaUpload, FaTimes } from 'react-icons/fa';

// Map category to Vietnamese label
const getCategoryLabel = (category) => {
  const labelMap = {
    'General Education': 'Bắt buộc chung',
    'Foundation': 'Cơ sở ngành',
    'Foundational': 'Cơ sở ngành',
    'Major': 'Chuyên ngành',
    'Elective': 'Bắt buộc chuyên ngành',
    'Internship': 'Thực tập',
    'Thesis': 'Luận văn tốt nghiệp',
    'Professional Education': 'Giáo dục chuyên nghiệp',
  };
  return labelMap[category] || category;
};

const defaultMajor = {
  name: '',
  description: '',
  degree: 'Kỹ sư',
  duration_years: 4,
  sort_order: 0,
};

const defaultCourse = {
  name: '',
  code: '',
  category: 'General Education',
  semester: 1,
  credits: 3,
  description: '',
};

export const MajorsManager = () => {
  const { token } = useAuth();
  const [majors, setMajors] = useState([]);
  const [selectedMajor, setSelectedMajor] = useState(null);
  const [majorForm, setMajorForm] = useState(defaultMajor);
  const [courseForm, setCourseForm] = useState(defaultCourse);
  const [editingMajor, setEditingMajor] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [majorModalOpen, setMajorModalOpen] = useState(false);
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [majorQuery, setMajorQuery] = useState('');
  const [courseQuery, setCourseQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: null, major: null, course: null });
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const handleSelectMajor = useCallback(async (major) => {
    try {
      const data = await fetchMajorWithCourses(major.id);
      setSelectedMajor(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const loadMajors = useCallback(async () => {
    try {
      const data = await fetchResource('majors');
      setMajors(data);
      return data;
    } catch (err) {
      setError(err.message);
      return [];
    }
  }, []);

  const reloadMajors = useCallback(
    async (preferredMajor = null) => {
      const data = await loadMajors();
      if (preferredMajor) {
        await handleSelectMajor(preferredMajor);
        return;
      }
      if (data.length) {
        await handleSelectMajor(data[0]);
      } else {
        setSelectedMajor(null);
      }
    },
    [handleSelectMajor, loadMajors]
  );

  useEffect(() => {
    let ignore = false;
    (async () => {
      const data = await loadMajors();
      if (!ignore && data.length) {
        await handleSelectMajor(data[0]);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [handleSelectMajor, loadMajors]);

  const handleOpenMajorModal = (major = null) => {
    if (major) {
      setEditingMajor(major);
      setMajorForm(major);
    } else {
      setEditingMajor(null);
      setMajorForm(defaultMajor);
    }
    setMajorModalOpen(true);
  };

  const handleCloseMajorModal = () => {
    setMajorModalOpen(false);
    setEditingMajor(null);
    setMajorForm(defaultMajor);
  };

  const submitMajor = async (event) => {
    event.preventDefault();
    try {
      // đảm bảo duration_years là số (số thập phân)
      const formData = {
        ...majorForm,
        duration_years: majorForm.duration_years ? parseFloat(majorForm.duration_years) : null,
      };
      
      let targetMajor = null;
      if (editingMajor) {
        targetMajor = await updateResource('majors', editingMajor.id, formData, token);
      } else {
        targetMajor = await createResource('majors', formData, token);
      }
      handleCloseMajorModal();
      await reloadMajors(targetMajor);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMajorChange = (name, value) => {
    setMajorForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenCourseModal = (course = null) => {
    if (course) {
      setEditingCourse(course);
      setCourseForm(course);
    } else {
      setEditingCourse(null);
      setCourseForm(defaultCourse);
    }
    setCourseModalOpen(true);
  };

  const handleCloseCourseModal = () => {
    setCourseModalOpen(false);
    setEditingCourse(null);
    setCourseForm(defaultCourse);
  };

  const submitCourse = async (event) => {
    event.preventDefault();
    if (!selectedMajor) return;
    try {
      if (editingCourse) {
        await updateCourse(selectedMajor.id, editingCourse.id, courseForm, token);
      } else {
        await createCourse(selectedMajor.id, courseForm, token);
      }
      handleCloseCourseModal();
      await handleSelectMajor(selectedMajor);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCourseChange = (name, value) => {
    setCourseForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleMajorDelete = async (major) => {
    // Nếu major đang được chọn, lấy số lượng môn học từ selectedMajor
    // Nếu không, cần fetch thông tin major để lấy số lượng môn học
    let courseCount = 0;
    if (selectedMajor?.id === major.id && selectedMajor?.courses) {
      courseCount = selectedMajor.courses.length;
    } else {
      // Fetch thông tin major để lấy số lượng môn học
      try {
        const majorData = await fetchMajorWithCourses(major.id);
        courseCount = majorData?.courses?.length || 0;
      } catch (err) {
        // Nếu không fetch được, vẫn cho phép xóa nhưng không hiển thị số lượng
        courseCount = 0;
      }
    }
    setDeleteConfirm({ 
      open: true, 
      type: 'major', 
      major, 
      course: null,
      courseCount 
    });
  };

  const confirmMajorDelete = async () => {
    if (deleteConfirm.major) {
      try {
        const response = await deleteResource('majors', deleteConfirm.major.id, token);
        if (selectedMajor?.id === deleteConfirm.major.id) {
          setSelectedMajor(null);
        }
        await reloadMajors();
        
        // Hiển thị thông báo thành công nếu có thông tin về số lượng môn học đã xóa
        if (response?.deletedCourses > 0) {
          setError(`Đã xóa thành công ngành học và ${response.deletedCourses} môn học thuộc ngành này`);
          // Tự động xóa thông báo sau 5 giây
          setTimeout(() => setError(null), 5000);
        } else {
          setError(null);
        }
      } catch (err) {
        // Xử lý lỗi từ backend - lấy message từ response nếu có
        let errorMessage = 'Không thể xóa ngành học này';
        if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.response?.data?.error) {
          errorMessage = err.response.data.error;
        } else if (err.message) {
          errorMessage = err.message;
        }
        setError(errorMessage);
      }
    }
    setDeleteConfirm({ open: false, type: null, major: null, course: null, courseCount: 0 });
  };

  const handleCourseDelete = async (course) => {
    setDeleteConfirm({ open: true, type: 'course', major: null, course });
  };

  const confirmCourseDelete = async () => {
    if (deleteConfirm.course && selectedMajor) {
      try {
        await deleteCourse(selectedMajor.id, deleteConfirm.course.id, token);
        await handleSelectMajor(selectedMajor);
      } catch (err) {
        setError(err.message);
      }
    }
    setDeleteConfirm({ open: false, type: null, major: null, course: null });
  };

  const handleDownloadTemplate = async () => {
    if (!selectedMajor) {
      alert('Vui lòng chọn ngành học trước');
      return;
    }
    try {
      const response = await downloadCoursesTemplate(selectedMajor.id, token);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'template_mon_hoc.xlsx');
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
    if (!selectedMajor) {
      setError('Vui lòng chọn ngành học');
      return;
    }
    try {
      setImporting(true);
      setError(null);
      const result = await importCoursesFromExcel(importFile, selectedMajor.id, token);
      setImportResult(result);
      await handleSelectMajor(selectedMajor);
      setImportFile(null);
    } catch (err) {
      console.error('Import error:', err);
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

  const filteredMajors = useMemo(() => {
    if (!majorQuery) return majors;
    const lower = majorQuery.toLowerCase();
    return majors.filter(
      (major) =>
        major.name?.toLowerCase().includes(lower) ||
        major.description?.toLowerCase().includes(lower)
    );
  }, [majors, majorQuery]);

  const filteredCourses = useMemo(() => {
    if (!selectedMajor?.courses) return [];
    if (!courseQuery) return selectedMajor.courses;
    const lower = courseQuery.toLowerCase();
    return selectedMajor.courses.filter(
      (course) =>
        course.name?.toLowerCase().includes(lower) ||
        course.code?.toLowerCase().includes(lower) ||
        course.category?.toLowerCase().includes(lower) ||
        course.description?.toLowerCase().includes(lower)
    );
  }, [selectedMajor, courseQuery]);

  const coursePagination = usePagination(filteredCourses, 10);

  useEffect(() => {
    if (coursePagination) coursePagination.reset();
  }, [courseQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-3">
        <aside className="rounded-2xl border border-slate-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Đào tạo</h3>
            <button
              type="button"
              onClick={() => handleOpenMajorModal()}
              className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark transition"
            >
              <FaPlus className="text-xs" />
              Thêm
            </button>
          </div>
          <div className="mb-4">
            <SearchBar
              value={majorQuery}
              onChange={setMajorQuery}
              placeholder="Tìm kiếm chương trình đào tạo..."
            />
          </div>
          <ul className="mt-4 space-y-2">
            {filteredMajors.map((major) => (
              <li
                key={major.id}
                onClick={() => handleSelectMajor(major)}
                className={`rounded-xl border bg-white p-3 cursor-pointer transition hover:shadow-md ${selectedMajor?.id === major.id ? 'border-primary' : 'border-slate-100'}`}
              >
                <div className="font-semibold text-slate-800">
                  {major.name}
                </div>
                <div className="mt-2 flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenMajorModal(major);
                    }}
                    className="flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 font-semibold text-primary hover:bg-primary/20 transition"
                  >
                    <FaEdit className="text-xs" />
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMajorDelete(major);
                    }}
                    className="flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 font-semibold text-red-500 hover:bg-red-100 transition"
                  >
                    <FaTrash className="text-xs" />
                    Xóa
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </aside>
        <section className="lg:col-span-2 space-y-6">
          {selectedMajor && (
            <div className="rounded-2xl border border-slate-100 p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Môn học — {selectedMajor.name}
                  </h3>
                  <p className="text-sm text-slate-500">Quản lý chương trình đào tạo theo học kỳ.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-2 rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10 transition"
                  >
                    <FaDownload />
                    Tải template
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportModalOpen(true)}
                    className="flex items-center gap-2 rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10 transition"
                  >
                    <FaUpload />
                    Import Excel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenCourseModal()}
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition"
                  >
                    <FaPlus />
                    Môn học mới
                  </button>
                </div>
              </div>
              <div className="mb-4">
                <SearchBar
                  value={courseQuery}
                  onChange={setCourseQuery}
                  placeholder="Tìm kiếm môn học theo mã, tên, danh mục..."
                />
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Mã</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Tên</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Danh mục</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Học kỳ</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Tín chỉ</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-600">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {coursePagination.paginatedItems.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-4 py-8 text-center text-sm text-slate-500">
                          {courseQuery ? 'Không tìm thấy kết quả' : 'Chưa có môn học'}
                        </td>
                      </tr>
                    ) : (
                      coursePagination.paginatedItems.map((course) => (
                        <tr key={course.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm text-slate-700">{course.code}</td>
                          <td className="px-4 py-3 text-sm text-slate-700 font-semibold">{course.name}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{getCategoryLabel(course.category)}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{course.semester}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{course.credits}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenCourseModal(course)}
                                className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                                title="Chỉnh sửa"
                              >
                                <FaEdit />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCourseDelete(course)}
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
              {coursePagination.totalPages > 1 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={coursePagination.currentPage}
                    totalPages={coursePagination.totalPages}
                    onPageChange={coursePagination.goToPage}
                  />
                </div>
              )}
            </div>
          )}
        </section>
      </div>
      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

      {/* Major Modal */}
      <MajorModal
        open={majorModalOpen}
        onClose={handleCloseMajorModal}
        onSubmit={submitMajor}
        formData={majorForm}
        onChange={handleMajorChange}
        editing={editingMajor}
      />

      {/* Course Modal */}
      <CourseModal
        open={courseModalOpen}
        onClose={handleCloseCourseModal}
        onSubmit={submitCourse}
        formData={courseForm}
        onChange={handleCourseChange}
        editing={editingCourse}
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, type: null, major: null, course: null, courseCount: 0 })}
        onConfirm={deleteConfirm.type === 'major' ? confirmMajorDelete : confirmCourseDelete}
        title="Xác nhận xóa"
        message={
          deleteConfirm.type === 'major'
            ? deleteConfirm.courseCount > 0
              ? `Xóa Chương trình đào tạo này? Tất cả ${deleteConfirm.courseCount} môn học thuộc ngành này cũng sẽ bị xóa.`
              : 'Xóa Chương trình đào tạo này?'
            : 'Xóa môn học này?'
        }
        confirmText="Xóa"
        cancelText="Hủy"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />

      {/* Import Excel Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 rounded-t-2xl">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Import môn học từ Excel</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Upload file Excel (.xlsx, .xls) để import nhiều môn học cùng lúc
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
                      <li><strong>Mã môn học</strong> - Bắt buộc, tối đa 50 ký tự, không được trùng</li>
                      <li><strong>Tên môn học</strong> - Bắt buộc, tối đa 200 ký tự</li>
                      <li><strong>Danh mục</strong> - Bắt buộc: General Education, Foundation, Major, Elective, Internship, Thesis, Professional Education</li>
                      <li><strong>Học kỳ</strong> - Bắt buộc, số từ 1 đến 16</li>
                      <li><strong>Tín chỉ</strong> - Bắt buộc, số từ 1 đến 10</li>
                      <li><strong>Mô tả</strong> - Tùy chọn, mô tả về môn học</li>
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
                      className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {importing ? (
                        <>
                          <span className="animate-spin">⏳</span>
                          Đang import...
                        </>
                      ) : (
                        <>
                          <FaUpload />
                          Import
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className={`rounded-lg p-4 border ${importResult.failed > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                    <p className={`text-sm font-semibold mb-2 ${importResult.failed > 0 ? 'text-yellow-900' : 'text-green-900'}`}>
                      {importResult.message || 'Import hoàn tất'}
                    </p>
                    <div className="text-xs space-y-1">
                      <p className={importResult.success > 0 ? 'text-green-700' : ''}>
                        ✓ Thành công: {importResult.success}
                      </p>
                      {importResult.failed > 0 && (
                        <p className="text-yellow-700">
                          ✗ Thất bại: {importResult.failed}
                        </p>
                      )}
                    </div>
                  </div>

                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="rounded-lg bg-red-50 p-4 border border-red-200 max-h-60 overflow-y-auto">
                      <p className="text-sm font-semibold text-red-900 mb-2">Chi tiết lỗi:</p>
                      <ul className="text-xs text-red-800 space-y-1 list-disc list-inside">
                        {importResult.errors.slice(0, 20).map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                        {importResult.errors.length > 20 && (
                          <li className="text-red-600">... và {importResult.errors.length - 20} lỗi khác</li>
                        )}
                      </ul>
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
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

