import { AlertTriangle, Activity, Timer, Gauge } from "lucide-react";
import { LiveCardBall } from "@/components/LiveCardBall";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { StatCard } from "@/components/StatCard";
import { useLiveMatch } from "@/hooks/useLiveMatch";
import { LiveFeedPanel } from "@/features/live/LiveFeedPanel";
import { formatOverBall } from "@/utils/format";
import { DownloadPatternReport } from "@/components/DownloadPatternReport";

export const LivePage = () => {
  const { data, isLoading, isError, error } = useLiveMatch();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton className="h-40" />
        <LoadingSkeleton className="h-60" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
        <div className="mb-2 flex items-center gap-2 font-semibold">
          <AlertTriangle size={16} />
          Live feed unavailable
        </div>
        <p>{(error as Error)?.message ?? "Unknown error"}</p>
      </div>
    );
  }

  const lastBall = data.balls[0] ?? {
    matchId: data.matchId,
    timestamp: data.lastUpdated,
    ballNumber: 0,
    runs: 0,
    isFour: false,
    isSix: false,
    isWicket: false,
    isDot: true,
    overNumber: 0
  };

  return (
    <section className="space-y-4 lg:space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-glass backdrop-blur-md">
        <DownloadPatternReport />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr]">
        <LiveCardBall ball={lastBall} />

        <div className="grid grid-cols-2 gap-4">
          <StatCard label="Total Balls" value={data.balls.length} icon={<Activity size={14} />} />
          <StatCard label="Current Over" value={formatOverBall(lastBall.ballNumber)} icon={<Timer size={14} />} />
          <StatCard label="Match Status" value={data.marketStatus} icon={<Gauge size={14} />} />
          <StatCard label="Match Status" value={data.status} hint={new Date(data.lastUpdated).toLocaleTimeString()} />
        </div>
      </div>

      <LiveFeedPanel balls={data.balls} />
    </section>
  );
};
