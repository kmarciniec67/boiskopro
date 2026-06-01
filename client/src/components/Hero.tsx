import { Link } from 'react-router-dom';

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-white/10 px-4 py-16 sm:px-6 sm:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <div className="relative mx-auto max-w-7xl">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-pitch-500/30 bg-pitch-500/10 px-4 py-1.5 text-sm text-pitch-400">
          Sezon 2026 — nowa kolekcja
        </p>
        <h1 className="max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl">
          Wszystko na boisko.
          <span className="block bg-gradient-to-r from-pitch-400 to-accent bg-clip-text text-transparent">
            Korki, piłki, stroje.
          </span>
        </h1>
        <p className="mt-4 max-w-xl text-lg text-white/60">
          Profesjonalny sprzęt piłkarski od sprawdzonych marek. Dostawa na terenie całej Polski.
        </p>
        <Link
          to="/#produkty"
          className="mt-8 inline-block rounded-xl bg-pitch-500 px-6 py-3 font-semibold text-pitch-950 shadow-lg shadow-pitch-500/25 hover:bg-pitch-400"
        >
          Przeglądaj ofertę
        </Link>
      </div>
    </section>
  );
}
