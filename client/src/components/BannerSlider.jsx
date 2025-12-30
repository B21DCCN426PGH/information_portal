import { useEffect, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

export const BannerSlider = ({ banners = [] }) => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!banners.length) return undefined;
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners]);

  if (!banners.length) {
    return (
      <div className="relative h-[500px] overflow-hidden bg-gradient-to-r from-primary to-primary-dark">
        <div className="flex h-full items-center justify-center text-white">
          <p className="text-lg">Banner sẽ hiển thị tại đây</p>
        </div>
      </div>
    );
  }

  const goTo = (direction) => {
    setActive((prev) => {
      if (direction === 'prev') {
        return prev === 0 ? banners.length - 1 : prev - 1;
      }
      return (prev + 1) % banners.length;
    });
  };

  const banner = banners[active];

  return (
    <div className="relative h-[500px] overflow-hidden shadow-2xl">
      {/* Background */}
      {banner?.image_url ? (
        <img
          src={banner.image_url}
          alt={banner.title}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-r from-primary to-primary-dark" />
      )}
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />
      
      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
        <h1 className="text-4xl font-bold md:text-5xl lg:text-6xl">
          {banner?.title || 'Tuyển sinh Đại học 2025'}
        </h1>
        <p className="mt-4 text-lg md:text-xl lg:text-2xl text-white/90">
          {banner?.subtitle || 'Cơ hội trở thành kỹ sư CNTT tương lai'}
        </p>
        <a
          href={banner?.cta_link || '/admissions'}
          className="mt-8 inline-block rounded-lg bg-primary px-8 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-primary-dark hover:shadow-xl"
        >
          {banner?.cta_label || 'Xem chi tiết'}
        </a>
      </div>

      {/* Arrows */}
      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo('prev')}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white backdrop-blur-sm transition hover:bg-white/30"
            aria-label="Banner trước"
          >
            <FaChevronLeft className="text-xl" />
          </button>
          <button
            type="button"
            onClick={() => goTo('next')}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white backdrop-blur-sm transition hover:bg-white/30"
            aria-label="Banner tiếp"
          >
            <FaChevronRight className="text-xl" />
          </button>
        </>
      )}

      {banners.length > 1 && (
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActive(index)}
              className={`h-2 rounded-full transition-all ${
                index === active ? 'w-8 bg-white' : 'w-2 bg-white/60 hover:bg-white/80'
              }`}
              aria-label={`Chuyển đến banner ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

