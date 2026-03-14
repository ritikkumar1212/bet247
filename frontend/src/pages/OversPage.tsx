import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Clock3, ListOrdered, ShieldCheck } from "lucide-react";
import { PatternTable } from "@/components/PatternTable";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { useOverPatterns } from "@/hooks/usePatterns";
import { OverFrequencyChart } from "@/features/overs/OverFrequencyChart";
import { useMatchDetails } from "@/hooks/useLiveMatch";
import { useDashboardSettings } from "@/hooks/useDashboardSettings";
import { formatDateTime } from "@/utils/format";
import type { BallEvent } from "@/types";

const formatBallResult = (ball: {
  ballNumber: number;
  runs: number;
  isWicket: boolean;
  isFour: boolean;
  isSix: boolean;
}) => {
  if (ball.isWicket) return "W";
  if (ball.isSix) return "6";
  if (ball.isFour) return "4";
  return String(ball.runs);
};

export const OversPage = () => {
  const { data, isLoading, isError, error } = useOverPatterns();
  const { setMatchId } = useDashboardSettings();
  const [selectedPatternRowId, setSelectedPatternRowId] = useState<string | number | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string>("");
  const detailQuery = useMatchDetails(selectedMatchId || undefined);

  const rows = useMemo(
    () =>
      (data ?? []).map((item, idx) => ({
        id: item.id ?? idx,
        sequence: `Over ${item.overNumber}: ${item.sequence}`,
        seenCount: item.seenCount,
        lastOccurrence: item.lastOccurrence,
        extra: item.matchId,
        matchId: item.matchId
      })),
    [data]
  );

  useEffect(() => {
    if (!rows.length) {
      setSelectedPatternRowId(null);
      setSelectedMatchId("");
      return;
    }

    setSelectedPatternRowId((current) => current ?? rows[0].id);
    setSelectedMatchId((current) => current || rows[0].matchId);
  }, [rows]);

  const overs = useMemo(() => {
    const grouped = new Map<number, BallEvent[]>();

    for (const ball of detailQuery.data?.balls ?? []) {
      const overBalls = grouped.get(ball.overNumber) ?? [];
      overBalls.push(ball);
      grouped.set(ball.overNumber, overBalls);
    }

    return [...grouped.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([overNumber, balls]) => ({ overNumber, balls }));
  }, [detailQuery.data?.balls]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton className="h-64" />
        <LoadingSkeleton className="h-80" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
        <div className="mb-2 flex items-center gap-2 font-semibold">
          <AlertTriangle size={16} />
          Failed to load over patterns
        </div>
        <p>{(error as Error)?.message ?? "Unknown error"}</p>
      </div>
    );
  }

  return (
    <section className="space-y-4 lg:space-y-6">
      <OverFrequencyChart patterns={data ?? []} />

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-glass backdrop-blur-md">
        <div className="mb-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Previous Match Occurrences</h3>
          <p className="mt-1 text-xs text-slate-400">
            Click any row to open that previous match and inspect all overs with ball-by-ball data.
          </p>
        </div>
        <PatternTable
          rows={rows}
          extraColumnLabel="Match"
          selectedRowId={selectedPatternRowId}
          onRowClick={(row) => {
            const matchId = row.extra ?? "";
            setSelectedPatternRowId(row.id);
            setSelectedMatchId(matchId);
            if (matchId) {
              setMatchId(matchId);
            }
          }}
        />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-glass backdrop-blur-md">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Selected Previous Match</h3>
            <p className="mt-1 font-mono text-sm text-slate-100">{selectedMatchId || "-"}</p>
          </div>

          {detailQuery.data ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-base-900/60 px-3 py-2">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
                  <ShieldCheck size={13} />
                  Match Status
                </div>
                <p className="mt-1 text-sm text-slate-100">{detailQuery.data.status}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-base-900/60 px-3 py-2">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
                  <ListOrdered size={13} />
                  Balls
                </div>
                <p className="mt-1 text-sm text-slate-100">{detailQuery.data.ballCount}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-base-900/60 px-3 py-2">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
                  <Clock3 size={13} />
                  Last Updated
                </div>
                <p className="mt-1 text-sm text-slate-100">{formatDateTime(detailQuery.data.lastUpdated)}</p>
              </div>
            </div>
          ) : null}
        </div>

        {detailQuery.isLoading ? (
          <div className="space-y-3">
            <LoadingSkeleton className="h-24" />
            <LoadingSkeleton className="h-24" />
            <LoadingSkeleton className="h-24" />
          </div>
        ) : detailQuery.data ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-base-900/60 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Team 1</p>
                <p className="mt-2 text-lg font-semibold text-slate-100">{detailQuery.data.teams.team1Name || "-"}</p>
                <p className="mt-1 font-mono text-sm text-accent-300">{detailQuery.data.teams.team1Score || "-"}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-base-900/60 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Team 2</p>
                <p className="mt-2 text-lg font-semibold text-slate-100">{detailQuery.data.teams.team2Name || "-"}</p>
                <p className="mt-1 font-mono text-sm text-accent-300">{detailQuery.data.teams.team2Score || "-"}</p>
              </div>
            </div>

            <div className="space-y-4">
              {overs.map((over) => (
                <div key={over.overNumber} className="rounded-xl border border-white/10 bg-base-900/50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
                      Over {over.overNumber + 1}
                    </h4>
                    <span className="text-xs text-slate-400">{over.balls.length} balls</span>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {over.balls.map((ball, index) => (
                      <div
                        key={`${ball.id ?? ball.ballNumber}-${index}`}
                        className="rounded-lg border border-white/10 bg-base-950/60 px-3 py-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs text-slate-400">Ball {index + 1}</span>
                          <span className="rounded-md bg-accent-500/10 px-2 py-0.5 text-xs font-semibold text-accent-300">
                            {formatBallResult(ball)}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-400">{formatDateTime(ball.timestamp)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 bg-base-900/40 p-6 text-sm text-slate-400">
            Select a previous match row above to view every over and all balls.
          </div>
        )}
      </div>
    </section>
  );
};
