import { useEffect, useMemo, useState } from 'react';
import { fetchResource } from '../services/api';
import { PageHero } from '../components/PageHero';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Modal } from '../components/Modal';
import { SearchBar } from '../components/SearchBar';
import { Pagination } from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';

export const NewsEvents = () => {
  const [news, setNews] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [newsQuery, setNewsQuery] = useState('');
  const [eventsQuery, setEventsQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [newsData, eventData] = await Promise.all([
        fetchResource('news'),
        fetchResource('events'),
      ]);
      setNews(newsData);
      setEvents(eventData);
      setLoading(false);
    };
    load();
  }, []);

  const filteredNews = useMemo(() => {
    if (!newsQuery) return news;
    const lower = newsQuery.toLowerCase();
    return news.filter(
      (item) =>
        item.title?.toLowerCase().includes(lower) ||
        item.summary?.toLowerCase().includes(lower) ||
        item.content?.toLowerCase().includes(lower)
    );
  }, [news, newsQuery]);

  const filteredEvents = useMemo(() => {
    if (!eventsQuery) return events;
    const lower = eventsQuery.toLowerCase();
    return events.filter(
      (item) =>
        item.title?.toLowerCase().includes(lower) ||
        item.description?.toLowerCase().includes(lower) ||
        item.location?.toLowerCase().includes(lower)
    );
  }, [events, eventsQuery]);

  const newsPagination = usePagination(filteredNews, 6);
  const eventsPagination = usePagination(filteredEvents, 6);

  useEffect(() => {
    if (newsPagination) newsPagination.reset();
  }, [newsQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (eventsPagination) eventsPagination.reset();
  }, [eventsQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return <LoadingSpinner label="Đang tải tin tức và sự kiện" />;
  }

  return (
    <div className="space-y-12">
      <PageHero
        title="Tin tức & Sự kiện"
        description="Khám phá các điểm nổi bật nghiên cứu, hoạt động sinh viên và sự kiện sắp tới."
      />
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-slate-900">Tin tức</h2>
        </div>
        <div className="mb-6">
          <SearchBar
            value={newsQuery}
            onChange={setNewsQuery}
            placeholder="Tìm kiếm tin tức..."
          />
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {newsPagination.paginatedItems.map((item) => (
            <article
              key={item.id}
              className="cursor-pointer rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition"
              onClick={() => setSelected({ ...item, type: 'Tin tức' })}
            >
              {item.image_url && (
                <div className="w-full h-48 overflow-hidden">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="p-6">
                <p className="text-xs uppercase tracking-widest text-primary">
                  {new Date(item.published_at || item.created_at).toLocaleDateString()}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600 line-clamp-3">{item.summary}</p>
              </div>
            </article>
          ))}
        </div>
        {newsPagination.totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={newsPagination.currentPage}
              totalPages={newsPagination.totalPages}
              onPageChange={newsPagination.goToPage}
            />
          </div>
        )}
      </section>
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-slate-900">Sự kiện</h2>
        </div>
        <div className="mb-6">
          <SearchBar
            value={eventsQuery}
            onChange={setEventsQuery}
            placeholder="Tìm kiếm sự kiện..."
          />
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {eventsPagination.paginatedItems.map((item) => (
            <article
              key={item.id}
              className="cursor-pointer rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition"
              onClick={() => setSelected({ ...item, type: 'Sự kiện' })}
            >
              {item.cover_image && (
                <div className="w-full h-48 overflow-hidden">
                  <img
                    src={item.cover_image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="p-6">
                <p className="text-xs uppercase tracking-widest text-primary">
                  {new Date(item.event_date).toLocaleDateString()}
                  {item.event_time && ` • ${item.event_time}`}
                  {item.location && ` • ${item.location}`}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600 line-clamp-3">{item.description}</p>
              </div>
            </article>
          ))}
        </div>
        {eventsPagination.totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={eventsPagination.currentPage}
              totalPages={eventsPagination.totalPages}
              onPageChange={eventsPagination.goToPage}
            />
          </div>
        )}
      </section>
      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={`${selected?.type}: ${selected?.title}`}
      >
        {selected && (
          <>
            {(selected.image_url || selected.cover_image) && (
              <div className="mb-4 w-full overflow-hidden rounded-lg">
                <img
                  src={selected.image_url || selected.cover_image}
                  alt={selected.title}
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
            {selected?.event_date ? (
              <div className="mb-4 text-sm text-slate-500">
                <p>
                  <span className="font-semibold">Ngày:</span>{' '}
                  {new Date(selected.event_date).toLocaleDateString('vi-VN')}
                </p>
                {selected.event_time && (
                  <p className="mt-1">
                    <span className="font-semibold">Giờ tổ chức:</span> {selected.event_time}
                  </p>
                )}
                {selected.location && (
                  <p className="mt-1">
                    <span className="font-semibold">Địa điểm:</span> {selected.location}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                {new Date(selected?.published_at || selected?.created_at).toLocaleString()}
              </p>
            )}
            <p className="mt-4 whitespace-pre-line">{selected?.content || selected?.description}</p>
          </>
        )}
      </Modal>
    </div>
  );
};


