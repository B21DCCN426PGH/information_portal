import { FaTimes } from 'react-icons/fa';

export const EnterpriseModal = ({ open, onClose, onSubmit, formData, onChange, editing }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex h-full max-h-[90vh] flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {editing ? 'Chỉnh sửa doanh nghiệp' : 'Thêm doanh nghiệp'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Điền thông tin doanh nghiệp dưới đây
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition"
              aria-label="Đóng"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Tên doanh nghiệp <span className="text-red-500">*</span>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={onChange}
                className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </label>

            <label className="text-sm font-medium text-slate-700 md:col-span-2">
              URL Logo <span className="text-red-500">*</span>
              <input
                type="url"
                name="logo_url"
                value={formData.logo_url || ''}
                onChange={onChange}
                placeholder="https://example.com/logo.png"
                className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
              <p className="mt-1 text-xs text-slate-500">Nhập URL của logo doanh nghiệp</p>
            </label>

            <label className="text-sm font-medium text-slate-700 md:col-span-2">
              Mô tả <span className="text-red-500">*</span>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={onChange}
                rows="4"
                className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </label>

            <label className="text-sm font-medium text-slate-700 md:col-span-2">
              Địa chỉ <span className="text-red-500">*</span>
              <input
                type="text"
                name="address"
                value={formData.address || ''}
                onChange={onChange}
                className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Website
              <input
                type="url"
                name="website"
                value={formData.website || ''}
                onChange={onChange}
                placeholder="https://example.com"
                className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Ngày hợp tác <span className="text-red-500">*</span>
              <div className="relative mt-1">
                <input
                  type="date"
                  name="partnership_date"
                  value={formData.partnership_date || ''}
                  onChange={onChange}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 pr-10 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Lĩnh vực hợp tác
              <input
                type="text"
                name="industry"
                value={formData.industry || ''}
                onChange={onChange}
                className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition"
              >
                {editing ? 'Lưu' : 'Thêm doanh nghiệp'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

