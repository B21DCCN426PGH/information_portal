import { useEffect, useState } from 'react';
import { getActiveInternshipPeriod, getAvailableInternshipLecturers, registerLecturer, getMyLecturerRegistration } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorState } from '../components/ErrorState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { NotificationPopup } from '../components/NotificationPopup';

export const RegisterLecturer = () => {
  const [activePeriod, setActivePeriod] = useState(null);
  const [lecturers, setLecturers] = useState([]);
  const [myRegistration, setMyRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [registering, setRegistering] = useState(false);
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

      // Lấy danh sách giảng viên có thể hướng dẫn
      const availableLecturers = await getAvailableInternshipLecturers(period.id);
      setLecturers(availableLecturers);

      // Kiểm tra đăng ký của sinh viên
      try {
        const registration = await getMyLecturerRegistration(period.id);
        if (registration && registration.length > 0) {
          setMyRegistration(registration[0]);
        }
      } catch (err) {
      }
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (lecturerId) => {
    if (!activePeriod) return;

    const isChanging = myRegistration && myRegistration.lecturer_id !== lecturerId;
    const confirmMessage = isChanging 
      ? 'Bạn có chắc chắn muốn đăng ký giảng viên này? (Sẽ thay thế giảng viên hiện tại)'
      : 'Bạn có chắc chắn muốn đăng ký giảng viên này?';
    
    setConfirmDialog({ open: true, lecturerId, message: confirmMessage });
  };

  const [confirmDialog, setConfirmDialog] = useState({ open: false, lecturerId: null, message: '' });

  const confirmRegister = async () => {
    if (confirmDialog.lecturerId && activePeriod) {
      try {
        setRegistering(true);
        await registerLecturer({
          period_id: activePeriod.id,
          lecturer_id: confirmDialog.lecturerId,
        });
        setNotification({ open: true, message: 'Đăng ký thành công!', type: 'success' });
        await loadData();
      } catch (err) {
        setNotification({ open: true, message: err.message || 'Đăng ký thất bại', type: 'error' });
      } finally {
        setRegistering(false);
        setConfirmDialog({ open: false, lecturerId: null, message: '' });
      }
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
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Đăng ký Giảng viên Hướng dẫn</h1>
        
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

        {myRegistration && (
          <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="font-semibold text-green-900">Bạn đã đăng ký:</p>
            <p className="text-sm text-green-700 mt-1">
              Giảng viên: {myRegistration.lecturer_name}
            </p>
            {myRegistration.notes && (
              <p className="text-sm text-green-600 mt-2">Ghi chú: {myRegistration.notes}</p>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Danh sách Giảng viên Hướng dẫn</h2>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-semibold flex items-center gap-2"
          >
            <span>🔄</span>
            REFRESH
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Tên giảng viên</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">SĐT</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Hướng nghiên cứu</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Số lượng slot</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {lecturers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                    Không có giảng viên nào có thể hướng dẫn trong đợt này
                  </td>
                </tr>
              ) : (
                lecturers.map((lecturer, index) => (
                  <tr key={lecturer.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-600">{index + 1}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">
                        {lecturer.name}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{lecturer.email}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{lecturer.phone || '-'}</td>
                    <td className="px-4 py-3">
                      {lecturer.research_direction ? (
                        <ul className="text-sm text-slate-600 list-disc list-inside">
                          {lecturer.research_direction.split(',').map((dir, i) => (
                            <li key={i}>{dir.trim()}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-700 font-medium">
                        {lecturer.current_slots ?? 0} / {lecturer.max_slots ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {myRegistration && myRegistration.lecturer_id === lecturer.id ? (
                        <span className="text-sm text-green-600 font-semibold">Đã đăng ký</span>
                      ) : (
                        <button
                          onClick={() => handleRegister(lecturer.id)}
                          disabled={!isInRegistrationPeriod || registering}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-semibold"
                        >
                          {registering ? 'Đang xử lý...' : 'Đăng ký'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, lecturerId: null, message: '' })}
        onConfirm={confirmRegister}
        title="Xác nhận đăng ký"
        message={confirmDialog.message}
        confirmText="Đăng ký"
        cancelText="Hủy"
        confirmButtonClass="bg-blue-600 hover:bg-blue-700"
      />

      <NotificationPopup
        open={notification.open}
        onClose={() => setNotification({ open: false, message: '', type: 'success' })}
        message={notification.message}
        type={notification.type}
      />
    </div>
  );
};

