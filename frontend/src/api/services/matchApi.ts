import { axiosInstance } from "@/api/axiosInstance";
import type { BallEvent, Match, MatchStatus } from "@/types";
import { safeNumber } from "@/utils/format";

const toStatus = (value: unknown): MatchStatus => {
  const normalized = String(value || "").toUpperCase();
  if (normalized === "LIVE" || normalized === "INNINGS_BREAK" || normalized === "COMPLETED") return normalized;
  return "UNKNOWN";
};

const normalizeBall = (raw: any): BallEvent => {
  const ballNumber = safeNumber(raw.ball_number ?? raw.ballNumber, 0);
  return {
    id: raw.id,
    matchId: String(raw.match_id ?? raw.matchId ?? "LIVE"),
    timestamp: String(raw.timestamp ?? raw.created_at ?? new Date().toISOString()),
    ballNumber,
    runs: safeNumber(raw.runs, 0),
    isFour: Boolean(raw.is_four ?? raw.isFour),
    isSix: Boolean(raw.is_six ?? raw.isSix),
    isWicket: Boolean(raw.is_wicket ?? raw.isWicket),
    isDot: Boolean(raw.is_dot ?? raw.isDot),
    overNumber: Math.max(1, Math.ceil(ballNumber / 6))
  };
};

export const matchApi = {
  async getLiveMatch(matchId?: string): Promise<Match> {
    const resolvedMatchId = String(matchId ?? "LIVE");
    const response = await axiosInstance.get(`/match/${encodeURIComponent(resolvedMatchId)}/live`);

    const payload = response.data;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new Error("Invalid live match response from API");
    }

    const balls = Array.isArray((payload as any).balls) ? (payload as any).balls.map(normalizeBall) : [];

    return {
      matchId: String((payload as any).match_id ?? (payload as any).matchId ?? resolvedMatchId),
      status: toStatus((payload as any).status),
      marketStatus: ((payload as any).market_status ?? (payload as any).marketStatus ?? "OPEN") as Match["marketStatus"],
      lastUpdated: String((payload as any).last_updated ?? (payload as any).lastUpdated ?? new Date().toISOString()),
      balls
    };
  }
};
