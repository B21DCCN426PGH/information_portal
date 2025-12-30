import { useEffect, useState } from 'react';
import { 
  getActiveInternshipPeriod, 
  getPeriodEnterprises, 
  registerPreferences, 
  getMyPreferences,
  getMyLecturerRegistration
} from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorState } from '../components/ErrorState';
import { NotificationPopup } from '../components/NotificationPopup';

export const RegisterPreferences = () => {
  const [activePeriod, setActivePeriod] = useState(null);
  const [enterprises, setEnterprises] = useState([]);
  const [myPreferences, setMyPreferences] = useState([]);
  const [hasLecturerRegistration, setHasLecturerRegistration] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPreferences, setSelectedPreferences] = useState([
    { enterprise_id: '', preference_order: 1 },
    { enterprise_id: '', preference_order: 2 },
    { enterprise_id: '', preference_order: 3 },
    { enterprise_id: '', preference_order: 4 },
    { enterprise_id: '', preference_order: 5 },
  ]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', type: 'success' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Lấy đợt đăng ký đang hoạt động
      const period = await getActiveInternshipPeriod();
      setActivePeriod(period);

      // Lấy danh sách doanh nghiệp theo đợt đăng ký
      if (period && period.id) {
        const enterpriseList = await getPeriodEnterprises({ period_id: period.id, is_active: true });
        setEnterprises(enterpriseList);

        // Kiểm tra đăng ký giảng viên của sinh viên
        try {
          const lecturerReg = await getMyLecturerRegistration(period.id);
          if (lecturerReg && lecturerReg.length > 0) {
            setHasLecturerRegistration(true);
          } else {
            setHasLecturerRegistration(false);
          }
        } catch (err) {
          setHasLecturerRegistration(false);
        }

        // Kiểm tra nguyện vọng của sinh viên
        try {
          const preferences = await getMyPreferences(period.id);
          if (preferences && preferences.length > 0) {
            setMyPreferences(preferences);
          }
        } catch (err) {
          // Không có nguyện vọng, bỏ qua
        }
      } else {
        setEnterprises([]);
      }
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    if (!hasLecturerRegistration) {
      setNotification({ open: true, message: 'Bạn phải đăng ký giảng viên hướng dẫn trước khi đăng ký nguyện vọng thực tập!', type: 'error' });
      return;
    }
    if (myPreferences.length > 0) {
      setNotification({ open: true, message: 'Bạn đã đăng ký nguyện vọng trong đợt này rồi!', type: 'error' });
      return;
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPreferences([
      { enterprise_id: '', preference_order: 1 },
      { enterprise_id: '', preference_order: 2 },
      { enterprise_id: '', preference_order: 3 },
      { enterprise_id: '', preference_order: 4 },
      { enterprise_id: '', preference_order: 5 },
    ]);
    setNotes('');
  };

  const handlePreferenceChange = (index, enterpriseId) => {
    const newPreferences = [...selectedPreferences];
    newPreferences[index].enterprise_id = enterpriseId;
    setSelectedPreferences(newPreferences);
  };

  const handleSubmit = async () => {
    // Validate: không được để trống và không được trùng
    const filledPreferences = selectedPreferences.filter(p => p.enterprise_id);
    
    if (filledPreferences.length === 0) {
      setNotification({ open: true, message: 'Vui lòng chọn ít nhất 1 nguyện vọng', type: 'error' });
      return;
    }

    const enterpriseIds = filledPreferences.map(p => p.enterprise_id);
    const uniqueIds = new Set(enterpriseIds);
    if (enterpriseIds.length !== uniqueIds.size) {
      setNotification({ open: true, message: 'Không được chọn trùng doanh nghiệp', type: 'error' });
      return;
    }

    // Đảm bảo thứ tự liên tục từ 1
    const orders = filledPreferences.map(p => p.preference_order).sort();
    for (let i = 0; i < orders.length; i++) {
      if (orders[i] !== i + 1) {
        setNotification({ open: true, message: 'Thứ tự nguyện vọng phải liên tục từ 1', type: 'error' });
        return;
      }
    }

    try {
      setSubmitting(true);
      await registerPreferences({
        period_id: activePeriod.id,
        preferences: filledPreferences,
        notes: notes || null,
      });
      setNotification({ open: true, message: 'Đăng ký nguyện vọng thành công!', type: 'success' });
      handleCloseModal();
      await loadData();
    } catch (err) {
      // Xử lý lỗi để hiển thị message rõ ràng
      let errorMessage = 'Đăng ký thất bại';
      if (err.message) {
        errorMessage = typeof err.message === 'string' ? err.message : JSON.stringify(err.message);
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      setNotification({ open: true, message: errorMessage, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  if (!activePeriod) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Hiện tại không có đợt đăng ký đang hoạt động.</p>
      </div>
    );
  }

  const now = new Date();
  const startDate = new Date(activePeriod.start_date);
  const endDate = new Date(activePeriod.end_date);
  const isInRegistrationPeriod = now >= startDate && now <= endDate;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Đăng ký Nguyện vọng Thực tập</h1>
        
        {activePeriod && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <p className="font-semibold text-slate-900">{activePeriod.name}</p>
            <p className="text-sm text-slate-600 mt-1">
              Thời gian đăng ký: {new Date(activePeriod.start_date).toLocaleString('vi-VN')} - {new Date(activePeriod.end_date).toLocaleString('vi-VN')}
            </p>
            {!isInRegistrationPeriod && (
              <p className="text-sm text-red-600 mt-2">⚠️ Không trong thời gian đăng ký</p>
            )}
          </div>
        )}

        {(() => {
          const approvedPreference = myPreferences.find(p => p.status === 'approved');
          return approvedPreference ? (
            <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="font-semibold text-green-900 mb-2">Nguyện vọng được duyệt:</p>
              <p className="text-sm text-green-700">
                {approvedPreference.enterprise_name} - ✅ Đã duyệt
              </p>
              {approvedPreference.notes && (
                <p className="text-sm text-green-600 mt-2">Ghi chú: {approvedPreference.notes}</p>
              )}
            </div>
          ) : null;
        })()}

        {!hasLecturerRegistration && (
          <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="font-semibold text-yellow-900">⚠️ Chưa đăng ký giảng viên hướng dẫn</p>
            <p className="text-sm text-yellow-700 mt-1">
              Bạn phải đăng ký giảng viên hướng dẫn trước khi có thể đăng ký nguyện vọng thực tập.
            </p>
          </div>
        )}

        {myPreferences.length === 0 && isInRegistrationPeriod && (
          <button
            onClick={handleOpenModal}
            disabled={!hasLecturerRegistration}
            className={`px-6 py-3 rounded-lg transition font-semibold ${
              hasLecturerRegistration
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            + Đăng ký nguyện vọng
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Danh sách Doanh nghiệp Thực tập</h2>
        </div>

        <div className="p-6">
          {enterprises.length === 0 ? (
            <p className="text-center text-slate-500 py-8">Không có doanh nghiệp nào</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Tên doanh nghiệp</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Mô tả công việc</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Địa chỉ</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Thông tin liên hệ</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Slot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {enterprises.map((enterprise) => {
                    const availableSlots = (enterprise.max_slots || 10) - (enterprise.current_slots || 0);
                    const isFull = availableSlots <= 0;
                    const isSelected = myPreferences.some(p => p.enterprise_id === enterprise.id);
                    
                    return (
                      <tr key={enterprise.id} className="hover:bg-slate-50">
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
                        <td className="px-4 py-3">
                          <span className={`text-sm font-semibold ${
                            isFull ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {enterprise.current_slots || 0} / {enterprise.max_slots || 10}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal đăng ký nguyện vọng */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Đăng ký Nguyện vọng Thực tập</h2>
              <p className="text-sm text-slate-600 mt-1">Chọn tối đa 5 doanh nghiệp (theo thứ tự ưu tiên)</p>
            </div>

            <div className="p-6 space-y-4">
              {selectedPreferences.map((pref, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-600 w-8">NV {pref.preference_order}:</span>
                  <select
                    value={pref.enterprise_id}
                    onChange={(e) => handlePreferenceChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  >
                    <option value="">-- Chọn doanh nghiệp --</option>
                    {enterprises.map((enterprise) => (
                      <option key={enterprise.id} value={enterprise.id}>
                        {enterprise.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              <div className="mt-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Ghi chú (tùy chọn)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="Nhập ghi chú nếu có..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {submitting ? 'Đang đăng ký...' : 'Đăng ký'}
              </button>
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

