import { useEffect, useMemo, useState } from 'react';
import { fetchResource } from '../services/api';
import { PageHero } from '../components/PageHero';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Modal } from '../components/Modal';
import { SearchBar } from '../components/SearchBar';
import { Pagination } from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';

export const Recruitment = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all', 'enterprise', 'faculty'

  useEffect(() => {
    const load = async () => {
      const data = await fetchResource('recruitment');
      setPosts(data);
      setLoading(false);
    };
    load();
  }, []);

  const filteredPosts = useMemo(() => {
    let filtered = posts;
    
    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((post) => post.category === categoryFilter);
    }
    
    // Filter by search query
    if (query) {
      const lower = query.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.title?.toLowerCase().includes(lower) ||
          post.company_name?.toLowerCase().includes(lower) ||
          post.position?.toLowerCase().includes(lower) ||
          post.job_description?.toLowerCase().includes(lower)
      );
    }
    
    return filtered;
  }, [posts, query, categoryFilter]);

  const pagination = usePagination(filteredPosts, 6);

  useEffect(() => {
    if (pagination) pagination.reset();
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return <LoadingSpinner label="Đang tải bài đăng tuyển dụng" />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 space-y-12">
      <PageHero
        title="Tuyển dụng & Nghề nghiệp"
        description="Cơ hội việc làm tại khoa và các doanh nghiệp dành cho sinh viên."
      />
      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Category Filter Dropdown */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-700">Loại tuyển dụng:</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">Tất cả</option>
              <option value="enterprise">Tuyển dụng doanh nghiệp</option>
              <option value="faculty">Tuyển dụng khoa</option>
            </select>
          </div>
          
          <div className="flex-1 sm:max-w-md">
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder="Tìm kiếm theo công ty, vị trí, mô tả công việc..."
            />
          </div>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {pagination.paginatedItems.map((post) => (
          <article
            key={post.id}
            className="rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-semibold px-2 py-1 rounded ${
                post.category === 'faculty' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-green-100 text-green-700'
              }`}>
                {post.category === 'faculty' ? 'Tuyển dụng khoa' : 'Tuyển dụng doanh nghiệp'}
              </span>
            </div>
            <p className="text-xs uppercase tracking-widest text-primary">{post.company_name}</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">{post.title}</h3>
            <p className="text-sm text-slate-500">{post.position}</p>
            <p className="mt-3 line-clamp-3 text-sm text-slate-600 whitespace-pre-line">{post.job_description}</p>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-slate-500">
                Hạn chót: {post.deadline ? new Date(post.deadline).toLocaleDateString() : 'Mở'}
              </span>
              <button
                type="button"
                className="font-semibold text-primary"
                onClick={() => setSelected(post)}
              >
                Xem chi tiết
              </button>
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
      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.title}>
        <p className="text-sm text-slate-500">
          {selected?.company_name} • {selected?.position}
        </p>
        <p className="whitespace-pre-line">{selected?.job_description}</p>
        <p className="text-sm text-slate-600">
          Liên hệ: {selected?.contact_email || 'N/A'}
          {selected?.apply_link && (
            <>
              {' '}
              |{' '}
              <a
                href={selected.apply_link}
                className="text-primary"
                target="_blank"
                rel="noreferrer"
              >
                Liên kết ứng tuyển
              </a>
            </>
          )}
        </p>
      </Modal>
    </div>
  );
};

