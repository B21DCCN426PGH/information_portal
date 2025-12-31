import { FaCheckCircle } from 'react-icons/fa';

export const SuccessDialog = ({ open, onClose, title = 'Thành công', message = 'Thao tác đã được thực hiện thành công!' }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <FaCheckCircle className="text-2xl text-green-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{message}</p>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

