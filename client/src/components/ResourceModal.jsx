import { FaTimes } from 'react-icons/fa';

export const ResourceModal = ({ open, isOpen, onClose, onSubmit, formData, onChange, editing, config, title, children }) => {
  const modalOpen = open !== undefined ? open : isOpen;
  if (!modalOpen) return null;

  const getTitle = () => {
    if (config?.modalTitle) {
      return editing ? config.modalTitle.edit : config.modalTitle.create;
    }
    return editing ? 'Chỉnh sửa bản ghi' : 'Thêm bản ghi mới';
  };

  const getDescription = () => {
    if (config?.modalDescription) {
      return config.modalDescription;
    }
    return 'Điền thông tin dưới đây';
  };

  const getSubmitLabel = () => {
    if (config?.submitLabel) {
      return editing ? config.submitLabel.edit : config.submitLabel.create;
    }
    return editing ? 'Lưu' : 'Tạo mới';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (onChange) {
      onChange(name, value);
    }
  };

  // Nếu có children, render với children 
  if (children) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
        <div className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
          <div className="flex h-full max-h-[90vh] flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{title || getTitle()}</h2>
                {config?.modalDescription && (
                  <p className="mt-1 text-sm text-slate-500">{getDescription()}</p>
                )}
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

            {/* Form với children */}
            <form onSubmit={onSubmit} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {children}
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
                  {editing ? 'Lưu' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Cách cũ: render với config.formFields
  if (!config || !config.formFields) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex h-full max-h-[90vh] flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{getTitle()}</h2>
              <p className="mt-1 text-sm text-slate-500">{getDescription()}</p>
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
            {config.formFields.map((field) => {
              const isFullWidth = field.fullWidth || field.type === 'textarea';
              const fieldValue = formData[field.name] || '';
              
              return (
                <label
                  key={field.name}
                  className={`text-sm font-medium text-slate-700 ${isFullWidth ? 'md:col-span-2' : ''}`}
                >
                  {field.label}
                  {field.required && <span className="text-red-500"> *</span>}
                  {field.type === 'textarea' ? (
                    <textarea
                      name={field.name}
                      value={fieldValue}
                      onChange={handleChange}
                      rows={field.rows || 4}
                      placeholder={field.placeholder}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required={field.required}
                    />
                  ) : field.type === 'number' ? (
                    <input
                      type="number"
                      name={field.name}
                      value={fieldValue}
                      onChange={handleChange}
                      placeholder={field.placeholder}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required={field.required}
                    />
                  ) : field.type === 'date' ? (
                    <input
                      type="date"
                      name={field.name}
                      value={fieldValue}
                      onChange={handleChange}
                      max={field.name === 'partnership_date' ? new Date().toISOString().split('T')[0] : undefined}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required={field.required}
                    />
                  ) : field.type === 'url' ? (
                    <>
                      <input
                        type="url"
                        name={field.name}
                        value={fieldValue}
                        onChange={handleChange}
                        placeholder={field.placeholder || 'https://example.com'}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        required={field.required}
                      />
                      {field.helpText && (
                        <p className="mt-1 text-xs text-slate-500">{field.helpText}</p>
                      )}
                    </>
                  ) : field.type === 'email' ? (
                    <input
                      type="email"
                      name={field.name}
                      value={fieldValue}
                      onChange={handleChange}
                      placeholder={field.placeholder || 'email@example.com'}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required={field.required}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      name={field.name}
                      value={fieldValue}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required={field.required}
                    >
                      {!fieldValue && field.placeholder && (
                        <option value="" disabled>
                          {field.placeholder}
                        </option>
                      )}
                      {field.options && field.options.length > 0 ? (
                        field.options.map((option) =>
                          typeof option === 'string' ? (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ) : (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          )
                        )
                      ) : (
                        !field.placeholder && <option value="">-- Chọn --</option>
                      )}
                    </select>
                  ) : field.type === 'datetime-local' ? (
                    <input
                      type="datetime-local"
                      name={field.name}
                      value={fieldValue}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required={field.required}
                    />
                  ) : field.type === 'time' ? (
                    <input
                      type="time"
                      name={field.name}
                      value={fieldValue}
                      onChange={handleChange}
                      placeholder={field.placeholder || 'HH:MM'}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required={field.required}
                    />
                  ) : (
                    <input
                      type={field.type || 'text'}
                      name={field.name}
                      value={fieldValue}
                      onChange={handleChange}
                      placeholder={field.placeholder}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required={field.required}
                    />
                  )}
                </label>
              );
            })}
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
                {getSubmitLabel()}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

