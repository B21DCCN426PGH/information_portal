export const EventCard = ({ item, onClick }) => (
  <article
    className="cursor-pointer rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    onClick={() => onClick(item)}
  >
    {item.cover_image && (
      <div className="w-full h-48 overflow-hidden">
        <img
          src={item.cover_image}
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
        {item.event_date ? new Date(item.event_date).toLocaleDateString('vi-VN') : 'TBA'}
        {item.event_time && ` • ${item.event_time}`}
        {item.location && ` • ${item.location}`}
      </p>
      <h3 className="mt-3 text-lg font-semibold text-slate-900">{item.title}</h3>
    </div>
  </article>
);

