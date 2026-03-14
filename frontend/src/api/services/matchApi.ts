import { axiosInstance } from "@/api/axiosInstance";
import type { BallEvent, Match, MatchDetails, MatchStatus, MatchSummary } from "@/types";
import { getOverFromBallNumber, safeNumber } from "@/utils/format";

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
    overNumber: getOverFromBallNumber(ballNumber)
  };
};

export const matchApi = {
  async getMatchesByDate(date: string): Promise<MatchSummary[]> {
    const response = await axiosInstance.get("/matches/by-date", {
      params: { date }
    });

    const list = Array.isArray(response.data) ? response.data : [];
    return list.map((item: any) => ({
      matchId: String(item.match_id ?? item.matchId ?? ""),
      startedAt: String(item.started_at ?? item.startedAt ?? ""),
      lastUpdated: String(item.last_updated ?? item.lastUpdated ?? ""),
      ballCount: safeNumber(item.ball_count ?? item.ballCount, 0),
      team1Name: String(item.team1_name ?? item.team1Name ?? ""),
      team1Score: String(item.team1_score ?? item.team1Score ?? ""),
      team2Name: String(item.team2_name ?? item.team2Name ?? ""),
      team2Score: String(item.team2_score ?? item.team2Score ?? "")
    }));
  },

  async getMatchDetails(matchId: string): Promise<MatchDetails> {
    const response = await axiosInstance.get(`/match/${encodeURIComponent(matchId)}`);
    const payload = response.data;
    const balls = Array.isArray(payload?.balls) ? payload.balls.map(normalizeBall) : [];

    return {
      matchId: String(payload?.match_id ?? payload?.matchId ?? matchId),
      status: toStatus(payload?.status ?? "COMPLETED"),
      marketStatus: (payload?.market_status ?? payload?.marketStatus ?? "CLOSED") as Match["marketStatus"],
      startedAt: String(payload?.started_at ?? payload?.startedAt ?? ""),
      lastUpdated: String(payload?.last_updated ?? payload?.lastUpdated ?? new Date().toISOString()),
      ballCount: safeNumber(payload?.ball_count ?? payload?.ballCount, balls.length),
      teams: {
        team1Name: String(payload?.teams?.team1_name ?? payload?.teams?.team1Name ?? ""),
        team1Score: String(payload?.teams?.team1_score ?? payload?.teams?.team1Score ?? ""),
        team2Name: String(payload?.teams?.team2_name ?? payload?.teams?.team2Name ?? ""),
        team2Score: String(payload?.teams?.team2_score ?? payload?.teams?.team2Score ?? "")
      },
      balls
    };
  },

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
