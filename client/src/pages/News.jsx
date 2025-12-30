import { useEffect, useMemo, useState } from 'react';
import { fetchResource } from '../services/api';
import { PageHero } from '../components/PageHero';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Modal } from '../components/Modal';
import { SearchBar } from '../components/SearchBar';
import { Pagination } from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';

export const News = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const newsData = await fetchResource('news');
      setNews(newsData);
      setLoading(false);
    };
    load();
  }, []);

  const filteredNews = useMemo(() => {
    if (!query) return news;
    const lower = query.toLowerCase();
    return news.filter(
      (item) =>
        item.title?.toLowerCase().includes(lower) ||
        item.summary?.toLowerCase().includes(lower) ||
        item.content?.toLowerCase().includes(lower)
    );
  }, [news, query]);

  const pagination = usePagination(filteredNews, 6);

  useEffect(() => {
    if (pagination) pagination.reset();
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return <LoadingSpinner label="Đang tải tin tức" />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 space-y-12">
      <PageHero
        title="Tin tức"
        description="Khám phá các điểm nổi bật nghiên cứu và hoạt động sinh viên."
      />
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-slate-900">Tất cả tin tức</h2>
        </div>
        <div className="mb-6">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Tìm kiếm tin tức..."
          />
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pagination.paginatedItems.map((item) => (
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
                  {new Date(item.published_at || item.created_at).toLocaleDateString('vi-VN')}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600 line-clamp-3">{item.summary}</p>
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
            {selected.image_url && (
              <div className="mb-4 w-full overflow-hidden rounded-lg">
                <img
                  src={selected.image_url}
                  alt={selected.title}
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
            <p className="text-sm text-slate-500 mb-4">
              {new Date(selected?.published_at || selected?.created_at).toLocaleString('vi-VN')}
            </p>
            <p className="mt-4 whitespace-pre-line">{selected?.content}</p>
          </>
        )}
      </Modal>
    </div>
  );
};

