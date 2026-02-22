import { Activity, BarChart3, Settings2, Waves, ShieldCheck } from "lucide-react";
import { NavLink } from "react-router-dom";
import clsx from "clsx";

const items = [
  { to: "/live", label: "Live Match", icon: Activity },
  { to: "/overs", label: "Over Patterns", icon: BarChart3 },
  { to: "/innings", label: "Innings Patterns", icon: Waves },
  { to: "/match-patterns", label: "Match Patterns", icon: ShieldCheck },
  { to: "/settings", label: "Settings", icon: Settings2 }
];

export const Sidebar = () => (
  <aside className="flex h-full w-full flex-col rounded-2xl border border-white/10 bg-base-900/70 p-4 shadow-glass backdrop-blur-lg">
    <div className="mb-8">
      <p className="font-display text-2xl font-bold text-white">BET247</p>
      <p className="text-xs uppercase tracking-widest text-accent-300">Cricket Analytics</p>
    </div>

    <nav className="space-y-2">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 rounded-xl border px-3 py-2 text-sm transition",
                isActive
                  ? "border-accent-500/40 bg-accent-500/10 text-accent-300"
                  : "border-transparent bg-base-800/40 text-slate-300 hover:border-white/10 hover:bg-base-800"
              )
            }
          >
            <Icon size={16} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  </aside>
);
