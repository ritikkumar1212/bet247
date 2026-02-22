import { percentage } from "@/utils/format";

export const SimilarityBar = ({ value }: { value: number }) => {
  const width = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
        <span>Similarity</span>
        <span className="font-mono">{percentage(width)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-base-700/80">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-accent-500" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
};
