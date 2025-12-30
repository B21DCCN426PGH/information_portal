import { useEffect, useState } from 'react';
import { fetchResource } from '../services/api';
import { PageHero } from '../components/PageHero';

export const StudentDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchResource('student-documents').then(setDocuments);
  }, []);

  const categories = Array.from(new Set(documents.map((doc) => doc.category).filter(Boolean)));
  const filtered = filter ? documents.filter((doc) => doc.category === filter) : documents;

  return (
    <div className="max-w-7xl mx-auto px-4 space-y-10">
      <PageHero
        title="Tài liệu sinh viên"
        description="Biểu mẫu, quy định và các mẫu hữu ích cho hành trình học tập của bạn."
      />
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setFilter('')}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            !filter ? 'bg-primary text-white' : 'bg-slate-200 text-slate-600'
          }`}
        >
          Tất cả
        </button>
        {categories.map((category) => (
          <button
            type="button"
            key={category}
            onClick={() => setFilter(category)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              filter === category ? 'bg-primary text-white' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {filtered.map((doc) => (
          <article
            key={doc.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-100 p-5 shadow-sm"
          >
            <div>
              <p className="text-xs uppercase tracking-widest text-primary">{doc.category}</p>
              <h3 className="text-lg font-semibold text-slate-900">{doc.title}</h3>
              <p className="text-sm text-slate-600">{doc.description}</p>
            </div>
            {doc.file_url && (
              <a
                href={doc.file_url}
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
                target="_blank"
                rel="noreferrer"
              >
                Tải xuống
              </a>
            )}
          </article>
        ))}
      </div>
    </div>
  );
};


