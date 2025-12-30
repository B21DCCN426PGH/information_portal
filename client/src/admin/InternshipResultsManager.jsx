import { useCallback, useEffect, useState } from 'react';
import { getInternshipPeriods, getInternshipResults, exportInternshipResults } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorState } from '../components/ErrorState';
import { FaChevronRight, FaChevronDown, FaFileExcel } from 'react-icons/fa';

export const InternshipResultsManager = () => {
  const { token } = useAuth();
  const [periods, setPeriods] = useState([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState(null);
  const [activeTab, setActiveTab] = useState('lecturers'); // 'lecturers' or 'enterprises'
  
  // Lecturers state
  const [lecturers, setLecturers] = useState([]);
  const [selectedLecturerId, setSelectedLecturerId] = useState(null);
  const [studentsByLecturer, setStudentsByLecturer] = useState([]);
  
  // Enterprises state
  const [enterprises, setEnterprises] = useState([]);
  const [selectedEnterpriseId, setSelectedEnterpriseId] = useState(null);
  const [studentsByEnterprise, setStudentsByEnterprise] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState(null);

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

  const loadLecturers = useCallback(async () => {
    if (!selectedPeriodId) return;

    try {
      setLoading(true);
      const data = await getInternshipResults({ period_id: selectedPeriodId }, token);
      setLecturers(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriodId, token]);

  const loadEnterprises = useCallback(async () => {
    if (!selectedPeriodId) return;

    try {
      setLoading(true);
      const data = await getInternshipResults({ period_id: selectedPeriodId, type: 'enterprises' }, token);
      setEnterprises(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriodId, token]);

  const loadStudentsByLecturer = useCallback(async (lecturerId) => {
    if (!lecturerId) {
      setStudentsByLecturer([]);
      return;
    }

    try {
      setLoadingStudents(true);
      const data = await getInternshipResults({ period_id: selectedPeriodId, lecturer_id: lecturerId }, token);
      setStudentsByLecturer(data);
    } catch (err) {
      console.error('Error loading students:', err);
      setStudentsByLecturer([]);
    } finally {
      setLoadingStudents(false);
    }
  }, [selectedPeriodId, token]);

  const loadStudentsByEnterprise = useCallback(async (enterpriseId) => {
    if (!enterpriseId) {
      setStudentsByEnterprise([]);
      return;
    }

    try {
      setLoadingStudents(true);
      const data = await getInternshipResults({ period_id: selectedPeriodId, enterprise_id: enterpriseId }, token);
      setStudentsByEnterprise(data);
    } catch (err) {
      console.error('Error loading students:', err);
      setStudentsByEnterprise([]);
    } finally {
      setLoadingStudents(false);
    }
  }, [selectedPeriodId, token]);

  useEffect(() => {
    loadPeriods();
  }, [loadPeriods]);

  useEffect(() => {
    if (selectedPeriodId) {
      if (activeTab === 'lecturers') {
        loadLecturers();
      } else {
        loadEnterprises();
      }
      setSelectedLecturerId(null);
      setSelectedEnterpriseId(null);
      setStudentsByLecturer([]);
      setStudentsByEnterprise([]);
    }
  }, [selectedPeriodId, activeTab, loadLecturers, loadEnterprises]);

  useEffect(() => {
    if (activeTab === 'lecturers') {
      if (selectedLecturerId) {
        loadStudentsByLecturer(selectedLecturerId);
      } else {
        setStudentsByLecturer([]);
      }
    } else {
      if (selectedEnterpriseId) {
        loadStudentsByEnterprise(selectedEnterpriseId);
      } else {
        setStudentsByEnterprise([]);
      }
    }
  }, [selectedLecturerId, selectedEnterpriseId, activeTab, loadStudentsByLecturer, loadStudentsByEnterprise]);

  const handleLecturerClick = (lecturerId) => {
    if (selectedLecturerId === lecturerId) {
      setSelectedLecturerId(null);
    } else {
      setSelectedLecturerId(lecturerId);
    }
  };

  const handleEnterpriseClick = (enterpriseId) => {
    if (selectedEnterpriseId === enterpriseId) {
      setSelectedEnterpriseId(null);
    } else {
      setSelectedEnterpriseId(enterpriseId);
    }
  };

  const [exporting, setExporting] = useState(false);

  const exportToExcel = async (item = null, type = null) => {
    if (!selectedPeriodId) {
      alert('Vui lòng chọn đợt đăng ký');
      return;
    }

    try {
      setExporting(true);
      const params = { period_id: selectedPeriodId };
      if (item) {
        if (type === 'lecturer') {
          params.lecturer_id = item.lecturer_id;
        } else if (type === 'enterprise') {
          params.enterprise_id = item.enterprise_id;
        }
      } else {
        // Export all
        if (activeTab === 'enterprises') {
          params.type = 'enterprises';
        }
      }
      await exportInternshipResults(params, token);
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      alert('Có lỗi xảy ra khi xuất Excel: ' + (err.message || 'Unknown error'));
    } finally {
      setExporting(false);
    }
  };

  if (error && !loading) {
    return <ErrorState message={error} onRetry={() => activeTab === 'lecturers' ? loadLecturers() : loadEnterprises()} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Kết quả đăng ký thực tập</h1>
        <p className="mt-1 text-sm text-slate-600">
          Xem danh sách giảng viên hướng dẫn và đơn vị thực tập cùng sinh viên đã đăng ký
        </p>
      </div>

      {/* Chọn đợt đăng ký */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Chọn đợt đăng ký
        </label>
        <select
          value={selectedPeriodId || ''}
          onChange={(e) => setSelectedPeriodId(e.target.value ? parseInt(e.target.value) : null)}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">-- Chọn đợt đăng ký --</option>
          {periods.map((period) => (
            <option key={period.id} value={period.id}>
              {period.name} {period.is_active ? '(Đang hoạt động)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      {selectedPeriodId && (
        <div className="border-b border-slate-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('lecturers')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'lecturers'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Theo giảng viên
            </button>
            <button
              onClick={() => setActiveTab('enterprises')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'enterprises'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Theo đơn vị thực tập
            </button>
          </nav>
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : selectedPeriodId && activeTab === 'lecturers' && lecturers.length > 0 ? (
        <div className="space-y-4">
          {/* Xuất Excel tất cả giảng viên */}
          <div className="flex justify-end">
            <button
              onClick={() => exportToExcel()}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <FaFileExcel />
              {exporting ? 'Đang xuất...' : 'Xuất Excel tất cả giảng viên'}
            </button>
          </div>

            {/* Danh sách giảng viên */}
          <div className="rounded-lg border border-slate-200 bg-white">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
              <h2 className="text-sm font-semibold uppercase text-slate-600">
                Danh sách giảng viên hướng dẫn ({lecturers.length})
              </h2>
            </div>
            <div className="divide-y divide-slate-200">
              {lecturers.map((lecturer) => (
                <div key={lecturer.lecturer_id}>
                  <button
                    onClick={() => handleLecturerClick(lecturer.lecturer_id)}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50 transition flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">{lecturer.lecturer_name}</div>
                      <div className="text-sm text-slate-600 mt-1">
                        Email: {lecturer.lecturer_email} | SĐT: {lecturer.lecturer_phone || '-'}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Số sinh viên: {lecturer.student_count} / {lecturer.max_slots} (Đã dùng: {lecturer.current_slots})
                      </div>
                    </div>
                    {selectedLecturerId === lecturer.lecturer_id ? (
                      <FaChevronDown className="text-slate-400 ml-4" />
                    ) : (
                      <FaChevronRight className="text-slate-400 ml-4" />
                    )}
                  </button>

                  {/* Danh sách sinh viên */}
                  {selectedLecturerId === lecturer.lecturer_id && (
                    <div className="bg-slate-50 border-t border-slate-200">
                      {loadingStudents ? (
                        <div className="px-4 py-8 text-center">
                          <LoadingSpinner />
                        </div>
                      ) : studentsByLecturer.length > 0 ? (
                        <div className="p-4">
                          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                              <h3 className="text-xs font-semibold uppercase text-slate-600">
                                Danh sách sinh viên ({studentsByLecturer.length})
                              </h3>
                              <button
                                onClick={() => exportToExcel(lecturer, 'lecturer')}
                                disabled={exporting}
                                className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                              >
                                <FaFileExcel />
                                {exporting ? 'Đang xuất...' : 'Xuất Excel'}
                              </button>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className="bg-slate-50">
                                  <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                                      Mã sinh viên
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                                      Họ và tên
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                                      Lớp
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                                      SĐT
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                                      Email
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                                      Doanh nghiệp đã duyệt
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                  {studentsByLecturer.map((student) => (
                                    <tr key={student.student_id} className="hover:bg-slate-50">
                                      <td className="px-4 py-3 text-sm text-slate-700">
                                        {student.student_code}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-slate-700">
                                        {student.student_name}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-slate-700">
                                        {student.class_name || '-'}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-slate-700">
                                        {student.phone || '-'}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-slate-700">
                                        {student.email || '-'}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-slate-700">
                                        {student.approved_enterprise_name || '-'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="px-4 py-8 text-center text-sm text-slate-500">
                          Không có sinh viên nào đã đăng ký giảng viên này
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : selectedPeriodId && activeTab === 'lecturers' && lecturers.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-500">Không có giảng viên nào có sinh viên đã đăng ký trong đợt này</p>
        </div>
      ) : selectedPeriodId && activeTab === 'enterprises' && enterprises.length > 0 ? (
        <div className="space-y-4">
          {/* Xuất Excel tất cả đơn vị thực tập */}
          <div className="flex justify-end">
            <button
              onClick={() => exportToExcel(null, 'enterprises')}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <FaFileExcel />
              {exporting ? 'Đang xuất...' : 'Xuất Excel tất cả đơn vị thực tập'}
            </button>
          </div>

          {/* Danh sách đơn vị thực tập */}
          <div className="rounded-lg border border-slate-200 bg-white">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
              <h2 className="text-sm font-semibold uppercase text-slate-600">
                Danh sách đơn vị thực tập ({enterprises.length})
              </h2>
            </div>
            <div className="divide-y divide-slate-200">
              {enterprises.map((enterprise) => (
                <div key={enterprise.enterprise_id}>
                  <button
                    onClick={() => handleEnterpriseClick(enterprise.enterprise_id)}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50 transition flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">{enterprise.enterprise_name}</div>
                      <div className="text-sm text-slate-600 mt-1">
                        Địa chỉ: {enterprise.enterprise_address || '-'} | Liên hệ: {enterprise.enterprise_contact || '-'}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Số sinh viên: {enterprise.student_count} / {enterprise.max_slots} (Đã dùng: {enterprise.current_slots})
                      </div>
                    </div>
                    {selectedEnterpriseId === enterprise.enterprise_id ? (
                      <FaChevronDown className="text-slate-400 ml-4" />
                    ) : (
                      <FaChevronRight className="text-slate-400 ml-4" />
                    )}
                  </button>

                    {/* Danh sách sinh viên */}
                  {selectedEnterpriseId === enterprise.enterprise_id && (
                    <div className="bg-slate-50 border-t border-slate-200">
                      {loadingStudents ? (
                        <div className="px-4 py-8 text-center">
                          <LoadingSpinner />
                        </div>
                      ) : studentsByEnterprise.length > 0 ? (
                        <div className="p-4">
                          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                              <h3 className="text-xs font-semibold uppercase text-slate-600">
                                Danh sách sinh viên ({studentsByEnterprise.length})
                              </h3>
                              <button
                                onClick={() => exportToExcel(enterprise, 'enterprise')}
                                disabled={exporting}
                                className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                              >
                                <FaFileExcel />
                                {exporting ? 'Đang xuất...' : 'Xuất Excel'}
                              </button>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className="bg-slate-50">
                                  <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                                      Mã sinh viên
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                                      Họ và tên
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                                      Lớp
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                                      SĐT
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                                      Email
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                                      Giảng viên hướng dẫn
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                  {studentsByEnterprise.map((student) => (
                                    <tr key={student.student_id} className="hover:bg-slate-50">
                                      <td className="px-4 py-3 text-sm text-slate-700">
                                        {student.student_code}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-slate-700">
                                        {student.student_name}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-slate-700">
                                        {student.class_name || '-'}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-slate-700">
                                        {student.phone || '-'}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-slate-700">
                                        {student.email || '-'}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-slate-700">
                                        {student.lecturer_name || '-'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="px-4 py-8 text-center text-sm text-slate-500">
                          Không có sinh viên nào đã đăng ký đơn vị thực tập này
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : selectedPeriodId && activeTab === 'enterprises' && enterprises.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-500">Không có đơn vị thực tập nào có sinh viên đã đăng ký trong đợt này</p>
        </div>
      ) : null}
    </div>
  );
};
