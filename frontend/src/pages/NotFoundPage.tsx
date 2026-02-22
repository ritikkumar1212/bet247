import { Link } from "react-router-dom";

export const NotFoundPage = () => (
  <section className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center shadow-glass backdrop-blur-md">
    <h1 className="font-display text-3xl font-bold text-white">404</h1>
    <p className="mt-2 text-slate-300">Page not found.</p>
    <Link to="/live" className="mt-4 inline-block rounded-lg border border-accent-500/40 bg-accent-500/10 px-4 py-2 text-accent-300">
      Back to Live
    </Link>
  </section>
);
