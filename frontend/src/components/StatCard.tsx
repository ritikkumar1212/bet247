import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
}

export const StatCard = ({ label, value, hint, icon }: StatCardProps) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-glass backdrop-blur-md">
    <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
      <span>{label}</span>
      {icon}
    </div>
    <div className="font-display text-2xl font-bold text-slate-100">{value}</div>
    {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
  </div>
);
