import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { MatchPattern } from "@/types";

export const MatchTimelineChart = ({ patterns }: { patterns: MatchPattern[] }) => {
  const top = patterns[0];
  const data = (top?.timeline ?? []).map((value, index) => ({
    ball: index + 1,
    run: Number(value) || (value === "W" ? -1 : 0)
  }));

  return (
    <div className="h-80 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-glass backdrop-blur-md">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">Cards Timeline</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="matchPattern" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22ff95" stopOpacity={0.75} />
              <stop offset="95%" stopColor="#22ff95" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis dataKey="ball" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
            cursor={{ stroke: "rgba(34,255,149,0.5)" }}
          />
          <Area type="monotone" dataKey="run" stroke="#22ff95" fill="url(#matchPattern)" strokeWidth={2.2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
