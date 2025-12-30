import { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight, FaBuilding } from 'react-icons/fa';

export const EnterpriseCarousel = ({ enterprises = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(4);

  // Calculate items per view based on screen size
  useEffect(() => {
    const updateItemsPerView = () => {
      const width = window.innerWidth;
      if (width >= 1536) {
        setItemsPerView(6); // 2xl - hiển thị nhiều hơn
      } else if (width >= 1280) {
        setItemsPerView(5); // xl
      } else if (width >= 1024) {
        setItemsPerView(4); // lg
      } else if (width >= 768) {
        setItemsPerView(3); // md
      } else if (width >= 640) {
        setItemsPerView(2); // sm
      } else {
        setItemsPerView(1); // mobile
      }
    };

    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, []);

  if (enterprises.length === 0) {
    return null;
  }

  // Calculate max index: can scroll until the last item is visible
  // If showing 6 items and have 13 total, max index = 13 - 6 = 7
  const maxIndex = Math.max(0, enterprises.length - itemsPerView);

  const goToPrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  // For pagination dots, calculate how many "pages" we can show
  // Each page shows itemsPerView items, but we move by 1 item
  const totalPages = Math.max(1, enterprises.length - itemsPerView + 1);
  
  const goToPage = (pageIndex) => {
    setCurrentIndex(pageIndex);
  };

  return (
    <div className="relative">
      {/* Title */}
      <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">
        Hợp tác đối ngoại doanh nghiệp
      </h2>

      {/* Carousel Container */}
      <div className="relative">
        {/* Navigation Arrows */}
        {enterprises.length > itemsPerView && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-primary transition"
              aria-label="Previous"
            >
              <FaChevronLeft className="text-lg" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-primary transition"
              aria-label="Next"
            >
              <FaChevronRight className="text-lg" />
            </button>
          </>
        )}

        {/* Carousel Content */}
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{
              transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
            }}
          >
            {enterprises.map((enterprise) => (
              <div
                key={enterprise.id}
                className="flex-shrink-0 px-3"
                style={{ width: `${100 / itemsPerView}%`, minWidth: `${100 / itemsPerView}%` }}
              >
                <a
                  href={enterprise.website || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex h-32 items-center justify-center rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-primary hover:shadow-md"
                >
                  {enterprise.logo_url ? (
                    <img
                      src={enterprise.logo_url}
                      alt={enterprise.name}
                      className="max-h-20 max-w-full object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) {
                          e.target.nextSibling.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div
                    className={`${enterprise.logo_url ? 'hidden' : 'flex'} h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-primary`}
                  >
                    <FaBuilding className="text-2xl" />
                  </div>
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pagination Dots */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToPage(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-8 bg-slate-900'
                  : 'w-2 bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label={`Go to page ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

