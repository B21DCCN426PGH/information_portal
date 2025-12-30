import { FaTimes, FaBuilding, FaMapMarkerAlt, FaGlobe, FaCalendarAlt, FaExternalLinkAlt, FaIndustry } from 'react-icons/fa';

export const EnterpriseDetailModal = ({ open, onClose, enterprise }) => {
  if (!open || !enterprise) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex h-full max-h-[90vh] flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
            <h2 className="text-xl font-semibold text-slate-900">Chi tiết doanh nghiệp</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition"
              aria-label="Đóng"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>

          {/* Nội dung */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {/* Logo + Name */}
            <div className="flex items-center gap-6 mb-6 pb-6 border-b border-slate-200">
              <div className="flex-shrink-0">
                <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
                  {enterprise.logo_url ? (
                    <img
                      src={enterprise.logo_url}
                      alt={enterprise.name}
                      className="max-h-16 max-w-16 object-contain p-2"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className={`${enterprise.logo_url ? 'hidden' : 'flex'} h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-primary`}
                  >
                    <FaBuilding className="text-2xl" />
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                  {enterprise.name}
                </h1>
              </div>
            </div>

            {/* Mô tả */}
            {enterprise.description && (
              <section className="mb-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-3">Giới thiệu</h2>
                <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {enterprise.description}
                </div>
              </section>
            )}

            {/* Thông tin liên hệ */}
            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Thông tin liên hệ</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {enterprise.industry && (
                  <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                    <FaIndustry className="text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-1">Lĩnh vực hợp tác</p>
                      <p className="text-slate-600">{enterprise.industry}</p>
                    </div>
                  </div>
                )}

                {enterprise.address && (
                  <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                    <FaMapMarkerAlt className="text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-1">Địa chỉ</p>
                      <p className="text-slate-600">{enterprise.address}</p>
                    </div>
                  </div>
                )}

                {enterprise.website && (
                  <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                    <FaGlobe className="text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-1">Website</p>
                      <a
                        href={enterprise.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:text-primary-dark font-medium inline-flex items-center gap-1 transition break-all"
                      >
                        {enterprise.website}
                        <FaExternalLinkAlt className="text-xs" />
                      </a>
                    </div>
                  </div>
                )}

                {enterprise.partnership_date && (
                  <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                    <FaCalendarAlt className="text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-1">Ngày hợp tác</p>
                      <p className="text-slate-600">{formatDate(enterprise.partnership_date)}</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

