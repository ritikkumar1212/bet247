import { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { PatternTable } from "@/components/PatternTable";
import { SimilarityBar } from "@/components/SimilarityBar";
import { useMatchPatternComparison } from "@/hooks/usePatterns";
import { MatchTimelineChart } from "@/features/match/MatchTimelineChart";

const toRows = (items: Array<{
  id?: number;
  timeline: string[];
  seenCount: number;
  lastOccurrence: string;
  matchId: string;
}>) =>
  items.map((item, idx) => ({
    id: item.id ?? `${item.matchId}-${idx}`,
    sequence: item.timeline.join("-"),
    seenCount: item.seenCount,
    lastOccurrence: item.lastOccurrence,
    extra: item.matchId
  }));

const SectionCard = ({
  title,
  subtitle,
  rows
}: {
  title: string;
  subtitle: string;
  rows: ReturnType<typeof toRows>;
}) => (
  <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-glass backdrop-blur-md">
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">{title}</h3>
      <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
    </div>
    <PatternTable rows={rows} extraColumnLabel="Match" />
  </div>
);

export const MatchPatternsPage = () => {
  const [historyDate, setHistoryDate] = useState("");
  const { data, isLoading, isError, error } = useMatchPatternComparison(historyDate || undefined);

  const previousRows = useMemo(() => toRows(data?.previous ?? []), [data?.previous]);
  const currentRows = useMemo(() => toRows(data?.current ?? []), [data?.current]);
  const matchedRows = useMemo(() => toRows(data?.matches ?? []), [data?.matches]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton className="h-28" />
        <LoadingSkeleton className="h-80" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
        <div className="mb-2 flex items-center gap-2 font-semibold">
          <AlertTriangle size={16} />
          Failed to load match comparison
        </div>
        <p>{(error as Error)?.message ?? "Unknown error"}</p>
      </div>
    );
  }

  return (
    <section className="space-y-4 lg:space-y-6">
      <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-glass backdrop-blur-md lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Match Pattern Matcher</h2>
            <p className="text-sm text-slate-400">
              1st selected old data, 2nd current match data, 3rd old patterns that also match the current match.
            </p>
          </div>

          <label className="block max-w-xs">
            <span className="mb-2 block text-xs uppercase tracking-wide text-slate-400">Previous Data Date</span>
            <input
              type="date"
              value={historyDate}
              onChange={(e) => setHistoryDate(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-base-800 px-3 py-2 text-slate-100 outline-none ring-accent-500 focus:ring"
            />
          </label>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Current Match</p>
            <p className="font-mono text-sm text-slate-100">{data?.currentMatchId ?? "LIVE"}</p>
          </div>
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">Older vs Current Match Score</p>
            <SimilarityBar value={matchedRows.length > 0 ? 100 : 0} />
          </div>
        </div>
      </div>

      <MatchTimelineChart
        patterns={(data?.matches?.length ? data.matches : data?.current ?? []).map((item) => ({
          id: item.id,
          matchId: item.matchId,
          timeline: item.timeline,
          similarityPercent: item.similarityPercent,
          seenCount: item.seenCount,
          lastOccurrence: item.lastOccurrence
        }))}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard
          title="1. Previous Data"
          subtitle={
            historyDate
              ? `Patterns saved on ${historyDate}.`
              : "Choose a date to load older pattern data."
          }
          rows={previousRows}
        />

        <SectionCard
          title="2. Current Data"
          subtitle="Patterns for the currently selected live match."
          rows={currentRows}
        />

        <SectionCard
          title="3. Matcher"
          subtitle="Older patterns whose exact signature also exists in the current match."
          rows={matchedRows}
        />
      </div>
    </section>
  );
};
