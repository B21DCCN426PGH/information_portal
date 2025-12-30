import { useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchHomeData } from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorState } from '../components/ErrorState';
import { StatsGrid } from '../components/StatsGrid';
import { BannerSlider } from '../components/BannerSlider';
import { SectionHeader } from '../components/SectionHeader';
import { EnterpriseCarousel } from '../components/EnterpriseCarousel';
import { VideoSection } from '../components/VideoSection';
import { NewsCard } from '../components/NewsCard';
import { EventCard } from '../components/EventCard';
import { Modal } from '../components/Modal';

export const Home = () => {
  const { data, loading, error } = useFetch(fetchHomeData, []);
  const [selectedNews, setSelectedNews] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  if (loading) {
    return <LoadingSpinner label="Đang tải thông tin cổng thông tin..." />;
  }

  if (error) {
    return <ErrorState message={error.message} />;
  }

  const { stats, banners = [], events = [], news = [], enterprises = [], admissions = [], facultyInfo } =
    data || {};
  
  // Giới hạn hiển thị 3 tin tức và 3 sự kiện
  const displayedNews = news.slice(0, 3);
  const displayedEvents = events.slice(0, 3);

  return (
    <>
      {/* Main Banner Slider - Full Width */}
      <section className="w-full">
        <BannerSlider banners={banners} />
      </section>

      {/* Content Container */}
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8 space-y-12">
        <section>
          <SectionHeader title="Khoa trong tầm nhìn" subtitle="Những điểm nổi bật từ cộng đồng của chúng tôi" />
          <StatsGrid stats={stats} />
        </section>

        {/* Tin tức Section */}
        <section id="news">
          <div className="relative mb-8">
            <SectionHeader
              title="Tin tức"
              subtitle="Cập nhật thông báo và thông tin mới nhất."
            />
            {displayedNews.length > 0 && (
              <Link
                to="/news"
                className="absolute top-0 right-0 text-sm font-medium text-primary hover:text-primary/80 transition"
              >
                Xem thêm →
              </Link>
            )}
          </div>
          {displayedNews.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {displayedNews.map((item) => (
                <NewsCard key={item.id} item={item} onClick={setSelectedNews} />
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-500 py-8">Chưa có tin tức nào.</p>
          )}
        </section>

        {/* Sự kiện Section */}
        <section id="events">
          <div className="relative mb-8">
            <SectionHeader
              title="Sự kiện"
              subtitle="Các hội thảo và cuộc thi sắp tới."
            />
            {displayedEvents.length > 0 && (
              <Link
                to="/events"
                className="absolute top-0 right-0 text-sm font-medium text-primary hover:text-primary/80 transition"
              >
                Xem thêm →
              </Link>
            )}
          </div>
          {displayedEvents.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {displayedEvents.map((item) => (
                <EventCard key={item.id} item={item} onClick={setSelectedEvent} />
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-500 py-8">Chưa có sự kiện nào.</p>
          )}
        </section>

        <section>
          <div className="relative mb-8">
            <SectionHeader
              title="Tuyển sinh nổi bật"
              subtitle="Lịch trình và điểm nổi bật cho các khóa tuyển sinh sắp tới"
            />
            {admissions.length > 0 && (
              <Link
                to="/admissions"
                className="absolute top-0 right-0 text-sm font-medium text-primary hover:text-primary/80 transition"
              >
                Xem thêm →
              </Link>
            )}
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {admissions.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                  {item.admission_year}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">{item.title || 'Tuyển sinh'}</h3>
                {item.quota && (
                  <p className="mt-3 text-sm text-slate-600">
                    <span className="font-semibold text-slate-700">Chỉ tiêu:</span> {item.quota} sinh viên
                  </p>
                )}
                {item.contact_point && (
                  <p className="mt-2 text-sm text-slate-600">
                    <span className="font-semibold text-slate-700">Liên hệ:</span> {item.contact_point}
                  </p>
                )}
                <Link
                  to="/admissions"
                  className="mt-4 inline-block text-sm font-semibold text-primary hover:text-primary/80 transition"
                >
                  Xem chi tiết →
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section>
          <EnterpriseCarousel enterprises={enterprises} />
        </section>

        <section>
          <SectionHeader title="Giới thiệu Khoa" />
          <VideoSection videoUrl={facultyInfo?.intro_video_url} />
        </section>
      </div>

      {/* Modal cho Tin tức */}
      <Modal
        open={Boolean(selectedNews)}
        onClose={() => setSelectedNews(null)}
        title={selectedNews?.title}
      >
        {selectedNews && (
          <>
            {selectedNews.image_url && (
              <div className="mb-4 w-full overflow-hidden rounded-lg">
                <img
                  src={selectedNews.image_url}
                  alt={selectedNews.title}
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
            <p className="text-sm text-slate-500">
              {new Date(selectedNews.published_at || selectedNews.created_at).toLocaleString()}
            </p>
            <p className="mt-4 whitespace-pre-line">{selectedNews?.content || selectedNews?.summary}</p>
          </>
        )}
      </Modal>

      {/* Modal cho Sự kiện */}
      <Modal
        open={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.title}
      >
        {selectedEvent && (
          <>
            {selectedEvent.cover_image && (
              <div className="mb-4 w-full overflow-hidden rounded-lg">
                <img
                  src={selectedEvent.cover_image}
                  alt={selectedEvent.title}
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="mb-4 text-sm text-slate-500">
              <p>
                <span className="font-semibold">Ngày:</span>{' '}
                {selectedEvent.event_date
                  ? new Date(selectedEvent.event_date).toLocaleDateString('vi-VN')
                  : 'TBA'}
              </p>
              {selectedEvent.event_time && (
                <p className="mt-1">
                  <span className="font-semibold">Giờ tổ chức:</span> {selectedEvent.event_time}
                </p>
              )}
              {selectedEvent.location && (
                <p className="mt-1">
                  <span className="font-semibold">Địa điểm:</span> {selectedEvent.location}
                </p>
              )}
            </div>
            <p className="mt-4 whitespace-pre-line">{selectedEvent?.description}</p>
          </>
        )}
      </Modal>
    </>
  );
};

