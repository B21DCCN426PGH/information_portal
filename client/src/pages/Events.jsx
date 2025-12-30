import { useEffect, useMemo, useState } from 'react';
import { fetchResource } from '../services/api';
import { PageHero } from '../components/PageHero';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Modal } from '../components/Modal';
import { SearchBar } from '../components/SearchBar';
import { Pagination } from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';

export const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const eventData = await fetchResource('events');
      setEvents(eventData);
      setLoading(false);
    };
    load();
  }, []);

  const filteredEvents = useMemo(() => {
    if (!query) return events;
    const lower = query.toLowerCase();
    return events.filter(
      (item) =>
        item.title?.toLowerCase().includes(lower) ||
        item.description?.toLowerCase().includes(lower) ||
        item.location?.toLowerCase().includes(lower)
    );
  }, [events, query]);

  const pagination = usePagination(filteredEvents, 6);

  useEffect(() => {
    if (pagination) pagination.reset();
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return <LoadingSpinner label="Đang tải sự kiện" />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 space-y-12">
      <PageHero
        title="Sự kiện"
        description="Các hội thảo và cuộc thi sắp tới."
      />
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-slate-900">Tất cả sự kiện</h2>
        </div>
        <div className="mb-6">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Tìm kiếm sự kiện..."
          />
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pagination.paginatedItems.map((item) => (
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
                  {new Date(item.event_date).toLocaleDateString('vi-VN')}
                  {item.event_time && ` • ${item.event_time}`}
                  {item.location && ` • ${item.location}`}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600 line-clamp-3">{item.description}</p>
              </div>
            </article>
          ))}
        </div>
        {pagination.totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={pagination.goToPage}
            />
          </div>
        )}
      </section>
      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.title}
      >
        {selected && (
          <>
            {selected.cover_image && (
              <div className="mb-4 w-full overflow-hidden rounded-lg">
                <img
                  src={selected.cover_image}
                  alt={selected.title}
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
            <p className="mt-4 whitespace-pre-line">{selected?.description}</p>
          </>
        )}
      </Modal>
    </div>
  );
};

