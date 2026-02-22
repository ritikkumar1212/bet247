import { useDashboardSettings } from "@/hooks/useDashboardSettings";

export const SettingsPage = () => {
  const { autoRefresh, setAutoRefresh, matchId, setMatchId } = useDashboardSettings();

  return (
    <section className="space-y-4">
      <h2 className="font-display text-2xl font-bold text-white">Settings</h2>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-glass backdrop-blur-md">
        <div className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-wide text-slate-400">Match ID</span>
            <input
              value={matchId}
              onChange={(e) => setMatchId(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-base-800 px-3 py-2 text-slate-100 outline-none ring-accent-500 focus:ring"
            />
          </label>

          <label className="flex items-center gap-3 text-slate-200">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-4 w-4 accent-emerald-400"
            />
            Enable 2-second auto refresh
          </label>

          <div className="rounded-lg border border-white/10 bg-base-900/80 p-3 text-xs text-slate-400">
            API URL: <span className="font-mono text-slate-200">{import.meta.env.VITE_API_URL}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
