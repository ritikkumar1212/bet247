import { motion } from "framer-motion";
import type { BallEvent } from "@/types";
import { RunsBadge } from "@/components/RunsBadge";
import { formatOverBall } from "@/utils/format";

export const LiveFeedPanel = ({ balls }: { balls: BallEvent[] }) => {
  const recent = [...balls].sort((a, b) => b.ballNumber - a.ballNumber).slice(0, 12);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-glass backdrop-blur-md">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">Recent Balls</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {recent.map((ball, index) => (
          <motion.div
            key={`${ball.ballNumber}-${ball.timestamp}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
            className="rounded-xl border border-white/10 bg-base-900/70 p-2"
          >
            <p className="mb-1 font-mono text-xs text-slate-400">{formatOverBall(ball.ballNumber)}</p>
            <RunsBadge runs={ball.runs} />
          </motion.div>
        ))}
      </div>
    </div>
  );
};
