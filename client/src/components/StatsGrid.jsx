const statConfig = [
  { key: 'total_majors', label: 'Chương trình đào tạo' },
  { key: 'total_lecturers', label: 'Giảng viên' },
  { key: 'total_students', label: 'Sinh viên' },
  { key: 'total_enterprises', label: 'Đối tác doanh nghiệp' },
];

export const StatsGrid = ({ stats = {} }) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {statConfig.map((stat) => (
      <div
        key={stat.key}
        className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
      >
        <p className="text-sm uppercase tracking-wide text-slate-500">{stat.label}</p>
        <p className="mt-2 text-3xl font-bold text-primary">
          {stats[stat.key] !== undefined ? stats[stat.key] : '--'}
        </p>
      </div>
    ))}
  </div>
);


