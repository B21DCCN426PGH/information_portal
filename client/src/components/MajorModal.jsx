import { FaTimes } from 'react-icons/fa';

export const MajorModal = ({ open, onClose, onSubmit, formData, onChange, editing }) => {
  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange(name, value);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex h-full max-h-[90vh] flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {editing ? 'Chỉnh sửa ngành học' : 'Thêm ngành học'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">Điền thông tin ngành học dưới đây</p>
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
              Tên ngành học <span className="text-red-500">*</span>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Bằng cấp <span className="text-red-500">*</span>
              <select
                name="degree"
                value={formData.degree !== undefined && formData.degree !== null ? formData.degree : 'Kỹ sư'}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              >
                <option value="Kỹ sư">Kỹ sư</option>
                <option value="Cử nhân">Cử nhân</option>
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Thời gian (năm) <span className="text-red-500">*</span>
              <input
                type="number"
                name="duration_years"
                value={formData.duration_years || ''}
                onChange={handleChange}
                min="1"
                max="10"
                step="0.1"
                placeholder="VD: 4 hoặc 4.5"
                className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
              <p className="mt-1 text-xs text-slate-500">Có thể nhập số thập phân (VD: 4.5)</p>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Thứ tự sắp xếp
              <input
                type="number"
                name="sort_order"
                value={formData.sort_order || ''}
                onChange={handleChange}
                min="0"
                className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>

            <label className="text-sm font-medium text-slate-700 md:col-span-2">
              Mô tả
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                rows="4"
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
                {editing ? 'Lưu' : 'Thêm ngành học'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

