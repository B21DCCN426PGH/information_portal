export const ErrorState = ({ message, onRetry }) => {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <span className="text-2xl">⚠️</span>
        </div>
        <h3 className="text-lg font-semibold text-slate-900">Có lỗi xảy ra</h3>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition"
          >
            Thử lại
          </button>
        )}
      </div>
    </div>
  );
};
