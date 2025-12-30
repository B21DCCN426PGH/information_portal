export const LoadingSpinner = ({ label = 'Đang tải...' }) => {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="mt-4 text-sm text-slate-600">{label}</p>
      </div>
    </div>
  );
};
