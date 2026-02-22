import { AlertTriangle } from "lucide-react";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { PatternTable } from "@/components/PatternTable";
import { useInningPatterns } from "@/hooks/usePatterns";
import { InningsCardsGrid } from "@/features/innings/InningsCardsGrid";

export const InningsPage = () => {
  const { data, isLoading, isError, error } = useInningPatterns();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton className="h-72" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
        <div className="mb-2 flex items-center gap-2 font-semibold">
          <AlertTriangle size={16} />
          Failed to load innings patterns
        </div>
        <p>{(error as Error)?.message ?? "Unknown error"}</p>
      </div>
    );
  }

  const rows = (data ?? []).map((item, idx) => ({
    id: item.id ?? idx,
    sequence: item.sequence.join("-"),
    seenCount: item.seenCount,
    lastOccurrence: item.lastOccurrence,
    extra: `${item.patternStrength.toFixed(0)}%`
  }));

  return (
    <section className="space-y-4 lg:space-y-6">
      <InningsCardsGrid patterns={data ?? []} />
      <PatternTable rows={rows} extraColumnLabel="Strength" />
    </section>
  );
};
