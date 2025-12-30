export const ConfirmDialog = ({ open, onClose, onConfirm, title, message, confirmText = 'Xác nhận', cancelText = 'Hủy', confirmButtonClass = 'bg-red-600 hover:bg-red-700' }) => {
  if (!open) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="px-6 py-5">
          {title && (
            <h3 className="text-lg font-semibold text-slate-900 mb-3">{title}</h3>
          )}
          <p className="text-sm text-slate-600 mb-6">{message}</p>
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition ${confirmButtonClass}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

