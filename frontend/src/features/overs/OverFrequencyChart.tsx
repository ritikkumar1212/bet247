import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { OverPattern } from "@/types";

export const OverFrequencyChart = ({ patterns }: { patterns: OverPattern[] }) => {
  const data = patterns.map((item) => ({
    over: `Over ${item.overNumber}`,
    seen: item.seenCount
  }));

  return (
    <div className="h-72 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-glass backdrop-blur-md">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">Pattern Frequency</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis dataKey="over" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.05)" }}
            contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
          />
          <Bar dataKey="seen" fill="#22ff95" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
