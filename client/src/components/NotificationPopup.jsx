import { useEffect } from 'react';
import { FaTimes, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

export const NotificationPopup = ({ open, onClose, message, type = 'success' }) => {
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Tự động đóng sau 3 giây
      return () => clearTimeout(timer);
    }
  }, [open, onClose]);

  if (!open) return null;

  const isSuccess = type === 'success';
  const icon = isSuccess ? <FaCheckCircle className="text-2xl text-green-500" /> : <FaExclamationCircle className="text-2xl text-red-500" />;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-800 shadow-2xl border border-slate-700">
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0">
              {icon}
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-base leading-relaxed">
                {message}
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full transition border border-blue-500"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

