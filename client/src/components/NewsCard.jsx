export const NewsCard = ({ item, onClick }) => (
  <article
    className="cursor-pointer rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    onClick={() => onClick(item)}
  >
    {item.image_url && (
      <div className="w-full h-48 overflow-hidden">
        <img
          src={item.image_url}
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
        {new Date(item.published_at || item.created_at).toLocaleDateString()}
      </p>
      <h3 className="mt-3 text-lg font-semibold text-slate-900">{item.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm text-slate-500">{item.summary || item.description}</p>
    </div>
  </article>
);


