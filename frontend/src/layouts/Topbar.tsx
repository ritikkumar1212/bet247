import { useDashboardSettings } from "@/hooks/useDashboardSettings";

export const Topbar = () => {
  const { autoRefresh, setAutoRefresh, matchId, setMatchId } = useDashboardSettings();

  return (
    <header className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-base-900/70 p-4 shadow-glass backdrop-blur-lg md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <span className="text-xs uppercase tracking-wider text-slate-400">Match ID</span>
          <input
            value={matchId}
            onChange={(e) => setMatchId(e.target.value)}
            className="rounded-md border border-white/15 bg-base-800/90 px-2 py-1 text-sm text-white outline-none ring-accent-500 focus:ring"
            placeholder="LIVE"
          />
        </label>

        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-accent-300">
          <span className="h-2.5 w-2.5 rounded-full bg-accent-500 shadow-neon animate-pulseLive" />
          Live
        </div>
      </div>

      <button
        type="button"
        onClick={() => setAutoRefresh(!autoRefresh)}
        className={
          autoRefresh
            ? "rounded-lg border border-accent-500/40 bg-accent-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-accent-300"
            : "rounded-lg border border-white/15 bg-base-800 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-300"
        }
      >
        Auto Refresh: {autoRefresh ? "On" : "Off"}
      </button>
    </header>
  );
};
