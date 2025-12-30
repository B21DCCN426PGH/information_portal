import { useEffect, useMemo, useState } from 'react';
import { fetchResource } from '../services/api';
import { PageHero } from '../components/PageHero';
import { SearchBar } from '../components/SearchBar';
import { Pagination } from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';

export const Research = () => {
  const [projects, setProjects] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchResource('research').then(setProjects);
  }, []);

  const filteredProjects = useMemo(() => {
    if (!query) return projects;
    const lower = query.toLowerCase();
    return projects.filter(
      (project) =>
        project.title?.toLowerCase().includes(lower) ||
        project.lead_lecturer?.toLowerCase().includes(lower) ||
        project.co_authors?.toLowerCase().includes(lower) ||
        project.journal_name?.toLowerCase().includes(lower) ||
        project.abstract?.toLowerCase().includes(lower)
    );
  }, [projects, query]);

  const pagination = usePagination(filteredProjects, 10);

  useEffect(() => {
    if (pagination) pagination.reset();
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="max-w-7xl mx-auto px-4 space-y-12">
      <PageHero
        title="Nghiên cứu khoa học"
        description="Khám phá các dự án tiên tiến do giảng viên và nhà nghiên cứu Khoa CNTT dẫn dắt."
      />
      <div className="mb-6">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Tìm kiếm theo tiêu đề, giảng viên, tác giả..."
        />
      </div>
      <div className="space-y-4">
        {pagination.paginatedItems.map((project) => (
          <article
            key={project.id}
            className="rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md"
          >
            <p className="text-xs uppercase tracking-widest text-primary">
              {project.research_period} •{' '}
              {project.publication_date && new Date(project.publication_date).toLocaleDateString()}
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">{project.title}</h3>
            <div className="mt-2 space-y-1 text-sm text-slate-500">
              {project.lead_lecturer && (
                <p>
                  <span className="font-semibold">Chủ trì:</span> {project.lead_lecturer}
                </p>
              )}
              {project.co_authors && (
                <p>
                  <span className="font-semibold">Đồng tác giả:</span> {project.co_authors}
                </p>
              )}
              {project.journal_name && (
                <p>
                  <span className="font-semibold">Tạp chí:</span> {project.journal_name}
                </p>
              )}
            </div>
            <p className="mt-3 text-sm text-slate-600">{project.abstract}</p>
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
    </div>
  );
};


