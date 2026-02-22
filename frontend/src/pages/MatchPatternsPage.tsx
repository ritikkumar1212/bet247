import { AlertTriangle } from "lucide-react";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { PatternTable } from "@/components/PatternTable";
import { SimilarityBar } from "@/components/SimilarityBar";
import { useMatchPatterns } from "@/hooks/usePatterns";
import { MatchTimelineChart } from "@/features/match/MatchTimelineChart";

export const MatchPatternsPage = () => {
  const { data, isLoading, isError, error } = useMatchPatterns();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton className="h-80" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
        <div className="mb-2 flex items-center gap-2 font-semibold">
          <AlertTriangle size={16} />
          Failed to load match patterns
        </div>
        <p>{(error as Error)?.message ?? "Unknown error"}</p>
      </div>
    );
  }

  const rows = (data ?? []).map((item, idx) => ({
    id: item.id ?? idx,
    sequence: item.timeline.join("-"),
    seenCount: item.seenCount,
    lastOccurrence: item.lastOccurrence,
    extra: `${item.similarityPercent.toFixed(0)}%`
  }));

  return (
    <section className="space-y-4 lg:space-y-6">
      <MatchTimelineChart patterns={data ?? []} />

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-glass backdrop-blur-md">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">Top Match Similarity</h3>
        <SimilarityBar value={data?.[0]?.similarityPercent ?? 0} />
      </div>

      <PatternTable rows={rows} extraColumnLabel="Similarity" />
    </section>
  );
};
