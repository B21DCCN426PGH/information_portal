import { FaExclamationCircle } from 'react-icons/fa';

export const ErrorDialog = ({ open, onClose, title = 'Lỗi', message, error }) => {
  if (!open) return null;

  // Lấy message từ error object nếu có
  let displayMessage = message;
  if (error) {
    if (typeof error === 'string') {
      displayMessage = error;
    } else if (error.message) {
      displayMessage = error.message;
    } else if (error.error) {
      displayMessage = error.error;
    } else if (error.response?.data?.error) {
      displayMessage = error.response.data.error;
    } else if (error.response?.data?.message) {
      displayMessage = error.response.data.message;
    } else {
      displayMessage = 'Có lỗi xảy ra';
    }
  }
  
  // Nếu không có message và error, sử dụng message mặc định
  if (!displayMessage) {
    displayMessage = 'Có lỗi xảy ra';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <FaExclamationCircle className="text-2xl text-red-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{displayMessage}</p>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

