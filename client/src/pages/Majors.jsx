import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchResource } from '../services/api';
import { PageHero } from '../components/PageHero';

export const Majors = () => {
  const [majors, setMajors] = useState([]);

  useEffect(() => {
    fetchResource('majors').then(setMajors);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 space-y-10">
      <PageHero
        title="Đào tạo"
        description="Các chương trình đại học với bản đồ chương trình đào tạo chi tiết."
      />
      <div className="grid gap-6 md:grid-cols-2">
        {majors.map((major) => (
          <article key={major.id} className="rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-primary">
              {major.degree && <span>{major.degree}</span>}
              {major.degree && major.duration_years && <span>•</span>}
              {major.duration_years && (
                <span>
                  {Number(major.duration_years).toFixed(1).replace(/\.0$/, '')} năm
                </span>
              )}
            </div>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">{major.name}</h3>
            <p className="mt-2 text-sm text-slate-600 line-clamp-3">{major.description}</p>
            <Link
              to={`/majors/${major.id}`}
              className="mt-4 inline-flex text-sm font-semibold text-primary"
            >
              Xem chương trình đào tạo →
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
};


