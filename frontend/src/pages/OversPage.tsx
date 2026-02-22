import { AlertTriangle } from "lucide-react";
import { PatternTable } from "@/components/PatternTable";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { useOverPatterns } from "@/hooks/usePatterns";
import { OverFrequencyChart } from "@/features/overs/OverFrequencyChart";

export const OversPage = () => {
  const { data, isLoading, isError, error } = useOverPatterns();

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

  const rows = (data ?? []).map((item, idx) => ({
    id: item.id ?? idx,
    sequence: `Over ${item.overNumber}: ${item.sequence}`,
    seenCount: item.seenCount,
    lastOccurrence: item.lastOccurrence,
    extra: item.matchId
  }));

  return (
    <section className="space-y-4 lg:space-y-6">
      <OverFrequencyChart patterns={data ?? []} />
      <PatternTable rows={rows} extraColumnLabel="Match" />
    </section>
  );
};
