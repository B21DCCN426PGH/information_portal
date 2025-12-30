export const Modal = ({ open, onClose, title, children, large = false }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className={`relative ${large ? 'max-h-[95vh] max-w-6xl' : 'max-h-[80vh] max-w-2xl'} w-full overflow-hidden rounded-3xl bg-white shadow-xl`}>
        <div className={`flex h-full ${large ? 'max-h-[95vh]' : 'max-h-[80vh]'} flex-col`}>
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h3 className="text-xl font-semibold text-slate-900 whitespace-nowrap overflow-hidden text-ellipsis pr-4">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-semibold uppercase tracking-wider text-primary"
            >
              Đóng
            </button>
          </div>
          <div className={`${large ? 'overflow-visible' : 'overflow-y-auto'} px-6 py-4`}>
            <div className="space-y-4 text-sm text-slate-600">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};


