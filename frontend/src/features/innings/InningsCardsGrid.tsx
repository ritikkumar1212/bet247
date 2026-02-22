import type { InningPattern } from "@/types";
import { SimilarityBar } from "@/components/SimilarityBar";

export const InningsCardsGrid = ({ patterns }: { patterns: InningPattern[] }) => (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {patterns.map((pattern, index) => (
      <article key={pattern.id ?? index} className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-glass backdrop-blur-md">
        <p className="mb-3 text-xs uppercase tracking-wide text-slate-400">Innings Match #{index + 1}</p>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {pattern.sequence.map((card, seqIndex) => (
            <span
              key={`${card}-${seqIndex}`}
              className="rounded-md border border-accent-500/25 bg-accent-500/10 px-2 py-1 font-mono text-xs text-accent-300"
            >
              {card}
            </span>
          ))}
        </div>
        <SimilarityBar value={pattern.patternStrength} />
      </article>
    ))}
  </div>
);
