import { useEffect, useMemo, useState } from 'react';
import { fetchResource } from '../services/api';
import { PageHero } from '../components/PageHero';
import { FaExternalLinkAlt, FaBuilding } from 'react-icons/fa';
import { SearchBar } from '../components/SearchBar';
import { Pagination } from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import { EnterpriseDetailModal } from '../components/EnterpriseDetailModal';

export const Enterprises = () => {
  const [enterprises, setEnterprises] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedEnterprise, setSelectedEnterprise] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchResource('enterprises').then(setEnterprises);
  }, []);

  const filteredEnterprises = useMemo(() => {
    if (!query) return enterprises;
    const lower = query.toLowerCase();
    return enterprises.filter(
      (item) =>
        item.name?.toLowerCase().includes(lower) ||
        item.industry?.toLowerCase().includes(lower) ||
        item.description?.toLowerCase().includes(lower)
    );
  }, [enterprises, query]);

  const pagination = usePagination(filteredEnterprises, 9);

  useEffect(() => {
    if (pagination) pagination.reset();
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="max-w-7xl mx-auto px-4 space-y-12">
      <PageHero
        title="Đối tác doanh nghiệp"
        description="Các công ty công nghệ hợp tác tạo ra chương trình, nghiên cứu và con đường sự nghiệp."
      />
      <div className="mb-6">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Tìm kiếm theo tên doanh nghiệp"
        />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {pagination.paginatedItems.map((item) => (
          <article
            key={item.id}
            onClick={() => {
              setSelectedEnterprise(item);
              setModalOpen(true);
            }}
            className="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-lg cursor-pointer"
          >
            {/* Logo */}
            <div className="mb-4 flex h-20 items-center justify-center rounded-xl bg-slate-50">
              {item.logo_url ? (
                <img
                  src={item.logo_url}
                  alt={item.name}
                  className="max-h-16 max-w-full object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className={`${item.logo_url ? 'hidden' : 'flex'} h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-primary`}
              >
                <FaBuilding className="text-2xl" />
              </div>
            </div>


            {/* Company Name */}
            <h3 className="mt-3 text-xl font-semibold text-slate-900">{item.name}</h3>

            {/* Description */}
            <p className="mt-2 line-clamp-3 text-sm text-slate-600">{item.description}</p>

            {/* Website Link */}
            {item.website && (
              <a
                href={item.website}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-dark transition"
              >
                Website
                <FaExternalLinkAlt className="text-xs" />
              </a>
            )}
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

      {/* Enterprise Detail Modal */}
      <EnterpriseDetailModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedEnterprise(null);
        }}
        enterprise={selectedEnterprise}
      />
    </div>
  );
};


