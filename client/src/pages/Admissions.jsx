import { useEffect, useState } from 'react';
import { fetchResource } from '../services/api';
import { PageHero } from '../components/PageHero';

export const Admissions = () => {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    fetchResource('admissions').then(setEntries);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 space-y-10">
      <PageHero
        title="Thông tin tuyển sinh"
        description="Chi tiết tuyển sinh hàng năm, chỉ tiêu, lịch trình và kênh liên hệ."
      />
      <div className="space-y-4">
        {entries.map((item) => (
          <article key={item.id} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-primary">{item.admission_year}</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">
              {item.title || `Tuyển sinh ${item.admission_year}`}
            </h3>
            <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">{item.description}</p>
            <div className="mt-4 grid gap-3 text-sm text-slate-500 sm:grid-cols-3">
              {item.timeline && <div><p className="font-semibold text-slate-700">Lịch trình</p><p>{item.timeline}</p></div>}
              {item.quota && <div><p className="font-semibold text-slate-700">Chỉ tiêu</p><p>{item.quota} sinh viên</p></div>}
              {item.contact_point && (
                <div>
                  <p className="font-semibold text-slate-700">Liên hệ</p>
                  <p>{item.contact_point}</p>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};


