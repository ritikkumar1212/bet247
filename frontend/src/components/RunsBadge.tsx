import clsx from "clsx";

interface RunsBadgeProps {
  runs: number;
}

export const RunsBadge = ({ runs }: RunsBadgeProps) => {
  const kind = runs === -1 ? "wicket" : runs >= 4 ? "high" : runs === 0 ? "dot" : "normal";

  return (
    <span
      className={clsx(
        "inline-flex min-w-10 justify-center rounded-md px-2.5 py-1 text-sm font-semibold",
        kind === "wicket" && "bg-rose-500/20 text-rose-300",
        kind === "high" && "bg-accent-500/15 text-accent-300",
        kind === "dot" && "bg-base-700 text-slate-300",
        kind === "normal" && "bg-sky-500/15 text-sky-300"
      )}
    >
      {runs === -1 ? "W" : runs}
    </span>
  );
};
