export const PageHero = ({ title, description }) => (
  <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-primary-dark py-8 text-white shadow-lg">
    <div className="absolute inset-0 opacity-10">
      <div className="h-full w-full bg-[radial-gradient(circle_at_top,_#fff,_transparent_60%)]" />
    </div>
    <div className="relative mx-auto max-w-5xl px-6 text-center">
      <h1 className="text-4xl font-bold">{title}</h1>
      {description && <p className="mx-auto mt-3 max-w-2xl text-white/80">{description}</p>}
    </div>
  </section>
);


