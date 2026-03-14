import { useEffect, useMemo, useState } from "react";
import { Activity, CalendarDays, Gauge, Timer } from "lucide-react";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { LiveCardBall } from "@/components/LiveCardBall";
import { StatCard } from "@/components/StatCard";
import { LiveFeedPanel } from "@/features/live/LiveFeedPanel";
import { useDashboardSettings } from "@/hooks/useDashboardSettings";
import { useMatchDetails, useMatchesByDate } from "@/hooks/useLiveMatch";
import { formatDateTime, formatOverBall } from "@/utils/format";

const getTodayDate = () => new Date().toISOString().slice(0, 10);

export const MatchPatternsPage = () => {
  const [selectedDate, setSelectedDate] = useState(getTodayDate);
  const [selectedMatchId, setSelectedMatchId] = useState<string>("");
  const { setMatchId } = useDashboardSettings();
  const matchesQuery = useMatchesByDate(selectedDate);
  const detailQuery = useMatchDetails(selectedMatchId || undefined);

  const matches = matchesQuery.data ?? [];
  const details = detailQuery.data;

  useEffect(() => {
    if (!matches.length) {
      setSelectedMatchId("");
      return;
    }

    setSelectedMatchId((current) =>
      current && matches.some((match) => match.matchId === current) ? current : matches[0].matchId
    );
  }, [matches]);

  useEffect(() => {
    if (selectedMatchId) {
      setMatchId(selectedMatchId);
    }
  }, [selectedMatchId, setMatchId]);

  const lastBall = useMemo(() => {
    if (details?.balls?.length) {
      return [...details.balls].sort((a, b) => b.ballNumber - a.ballNumber)[0];
    }

    return {
      matchId: details?.matchId ?? selectedMatchId,
      timestamp: details?.lastUpdated ?? new Date().toISOString(),
      ballNumber: 0,
      runs: 0,
      isFour: false,
      isSix: false,
      isWicket: false,
      isDot: true,
      overNumber: 0
    };
  }, [details, selectedMatchId]);

  return (
    <section className="space-y-4 lg:space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-glass backdrop-blur-md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Match Browser</h2>
            <p className="text-sm text-slate-400">
              Select a date, view the matches played on that day, then click a match to see its details.
            </p>
          </div>

          <label className="block w-full max-w-xs">
            <span className="mb-2 block text-xs uppercase tracking-wide text-slate-400">Match Date</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-base-800 px-3 py-2 text-slate-100 outline-none ring-accent-500 focus:ring"
            />
          </label>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-glass backdrop-blur-md">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Matches</h3>
            <span className="text-xs text-slate-400">{matches.length} found</span>
          </div>

          {matchesQuery.isLoading ? (
            <div className="space-y-3">
              <LoadingSkeleton className="h-20" />
              <LoadingSkeleton className="h-20" />
              <LoadingSkeleton className="h-20" />
            </div>
          ) : matches.length ? (
            <div className="space-y-3">
              {matches.map((match) => {
                const active = match.matchId === selectedMatchId;
                const title = [match.team1Name, "vs", match.team2Name].filter(Boolean).join(" ");

                return (
                  <button
                    key={match.matchId}
                    type="button"
                    onClick={() => setSelectedMatchId(match.matchId)}
                    className={
                      active
                        ? "w-full rounded-2xl border border-accent-500/40 bg-accent-500/10 p-4 text-left"
                        : "w-full rounded-2xl border border-white/10 bg-base-900/60 p-4 text-left transition hover:border-white/20 hover:bg-base-900/80"
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-100">{title || match.matchId}</p>
                        <p className="mt-1 font-mono text-xs text-slate-400">{match.matchId}</p>
                      </div>
                      <CalendarDays size={16} className="text-slate-500" />
                    </div>

                    <div className="mt-3 space-y-1 text-sm text-slate-300">
                      <p>
                        {match.team1Name || "Team 1"}: {match.team1Score || "-"}
                      </p>
                      <p>
                        {match.team2Name || "Team 2"}: {match.team2Score || "-"}
                      </p>
                    </div>

                    <p className="mt-3 text-xs text-slate-400">Last update: {formatDateTime(match.lastUpdated)}</p>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 bg-base-900/40 p-6 text-sm text-slate-400">
              No matches found for {selectedDate || "the selected date"}.
            </div>
          )}
        </div>

        <div className="space-y-4">
          {detailQuery.isLoading ? (
            <>
              <LoadingSkeleton className="h-40" />
              <LoadingSkeleton className="h-60" />
            </>
          ) : details ? (
            <>
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr]">
                <LiveCardBall ball={lastBall} />

                <div className="grid grid-cols-2 gap-4">
                  <StatCard label="Total Balls" value={details.ballCount} icon={<Activity size={14} />} />
                  <StatCard
                    label="Final Over"
                    value={lastBall.ballNumber ? formatOverBall(lastBall.ballNumber) : "-"}
                    icon={<Timer size={14} />}
                  />
                  <StatCard label="Market Status" value={details.marketStatus} icon={<Gauge size={14} />} />
                  <StatCard label="Match Status" value={details.status} hint={formatDateTime(details.lastUpdated)} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-glass backdrop-blur-md">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Team 1</p>
                  <p className="mt-2 text-lg font-semibold text-slate-100">{details.teams.team1Name || "-"}</p>
                  <p className="mt-1 font-mono text-sm text-accent-300">{details.teams.team1Score || "-"}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-glass backdrop-blur-md">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Team 2</p>
                  <p className="mt-2 text-lg font-semibold text-slate-100">{details.teams.team2Name || "-"}</p>
                  <p className="mt-1 font-mono text-sm text-accent-300">{details.teams.team2Score || "-"}</p>
                </div>
              </div>

              <LiveFeedPanel balls={details.balls} />
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-base-900/40 p-8 text-sm text-slate-400">
              Select a match from the list to view match details.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
