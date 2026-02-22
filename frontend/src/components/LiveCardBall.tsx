import { motion } from "framer-motion";
import type { BallEvent } from "@/types";
import { RunsBadge } from "@/components/RunsBadge";
import { WicketIndicator } from "@/components/WicketIndicator";

export const LiveCardBall = ({ ball }: { ball: BallEvent }) => (
  <motion.div
    key={ball.id ?? `${ball.ballNumber}-${ball.timestamp}`}
    initial={{ opacity: 0, y: 16, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.25 }}
    className="rounded-2xl border border-accent-500/20 bg-gradient-to-br from-accent-500/10 to-sky-400/10 p-5 shadow-neon"
  >
    <div className="mb-4 flex items-center justify-between">
      <span className="font-mono text-xs uppercase tracking-wider text-accent-300">Last Ball</span>
      <WicketIndicator isWicket={ball.isWicket} />
    </div>
    <div className="flex items-end justify-between gap-4">
      <div>
        <div className="font-display text-4xl font-bold text-white">{ball.overNumber}.{((ball.ballNumber - 1) % 6) + 1}</div>
        <p className="mt-1 text-xs text-slate-300">Ball #{ball.ballNumber}</p>
      </div>
      <RunsBadge runs={ball.runs} />
    </div>
  </motion.div>
);
