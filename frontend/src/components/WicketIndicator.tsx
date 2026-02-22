export const WicketIndicator = ({ isWicket }: { isWicket: boolean }) => (
  <div
    className={
      isWicket
        ? "rounded-md border border-rose-400/50 bg-rose-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-300"
        : "rounded-md border border-base-700 bg-base-900/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-400"
    }
  >
    {isWicket ? "Wicket" : "In Play"}
  </div>
);
