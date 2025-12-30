export const SectionHeader = ({ title, subtitle }) => (
  <div className="mb-8 text-center">
    <h2 className="text-3xl font-bold text-slate-900">{title}</h2>
    {subtitle && <p className="mt-2 text-slate-500">{subtitle}</p>}
    <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-primary" />
  </div>
);


