import { FaTimes } from 'react-icons/fa';

const courseCategories = [
  { value: 'General Education', label: 'Bắt buộc chung' },
  { value: 'Foundation', label: 'Cơ sở ngành' },
  { value: 'Major', label: 'Chuyên ngành' },
  { value: 'Elective', label: 'Bắt buộc chuyên ngành' },
  { value: 'Internship', label: 'Thực tập' },
  { value: 'Thesis', label: 'Luận văn tốt nghiệp' },
  { value: 'Professional Education', label: 'Giáo dục chuyên nghiệp' },
];

export const CourseModal = ({ open, onClose, onSubmit, formData, onChange, editing }) => {
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
                {editing ? 'Chỉnh sửa môn học' : 'Thêm môn học'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">Điền thông tin môn học dưới đây</p>
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
              Tên môn học <span className="text-red-500">*</span>
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
              Mã môn học <span className="text-red-500">*</span>
              <input
                type="text"
                name="code"
                value={formData.code || ''}
                onChange={handleChange}
                placeholder="VD: CS101"
                className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Danh mục <span className="text-red-500">*</span>
              <select
                name="category"
                value={formData.category || 'General Education'}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              >
                {courseCategories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Học kỳ <span className="text-red-500">*</span>
              <input
                type="number"
                name="semester"
                value={formData.semester || ''}
                onChange={handleChange}
                min="1"
                max="16"
                className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Tín chỉ <span className="text-red-500">*</span>
              <input
                type="number"
                name="credits"
                value={formData.credits || ''}
                onChange={handleChange}
                min="1"
                max="10"
                className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
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
                {editing ? 'Lưu' : 'Thêm môn học'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

