import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchResource } from '../services/api';
import { PageHero } from '../components/PageHero';
import { SearchBar } from '../components/SearchBar';

export const Departments = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchResource('departments').then((data) => {
      setDepartments(data);
      // Auto redirect to first department if available
      if (data && data.length > 0) {
        navigate(`/departments/${data[0].id}`, { replace: true });
      }
    });
  }, [navigate]);

  const filtered = useMemo(() => {
    if (!query) return departments;
    const lower = query.toLowerCase();
    return departments.filter(
      (dept) =>
        dept.name?.toLowerCase().includes(lower) ||
        dept.description?.toLowerCase().includes(lower) ||
        dept.lecturers?.some((lecturer) =>
          lecturer.name?.toLowerCase().includes(lower) ||
          lecturer.email?.toLowerCase().includes(lower)
        )
    );
  }, [departments, query]);

  return (
    <div className="max-w-7xl mx-auto px-4 space-y-10">
      <PageHero
        title="Bộ môn"
        description="Tìm hiểu về các bộ môn và đội ngũ giảng viên trong từng bộ môn."
      />
      <div className="mb-6">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Tìm kiếm theo tên bộ môn, giảng viên..."
        />
      </div>
      <div className="space-y-4">
        {filtered.map((department) => (
          <article
            key={department.id}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition cursor-pointer"
            onClick={() => navigate(`/departments/${department.id}`)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-slate-900">{department.name}</h3>
                {department.description && (
                  <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                    {department.description}
                  </p>
                )}
                {department.lecturers && department.lecturers.length > 0 && (
                  <p className="mt-2 text-xs text-slate-500">
                    {department.lecturers.length} {department.lecturers.length === 1 ? 'giảng viên' : 'giảng viên'}
                  </p>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="text-center text-slate-500 py-12">Không tìm thấy bộ môn nào</p>
      )}
    </div>
  );
};

