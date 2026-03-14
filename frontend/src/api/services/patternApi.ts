import { axiosInstance } from "@/api/axiosInstance";
import type { InningPattern, MatchPattern, MatchPatternComparison, MatchPatternComparisonItem, OverPattern } from "@/types";
import { safeNumber } from "@/utils/format";

const toArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === "string") return value.split(/[-,\s]+/).filter(Boolean);
  return [];
};

export const patternApi = {
  async getOverPatterns(matchId?: string): Promise<OverPattern[]> {
    const response = await axiosInstance.get("/patterns/overs", {
      params: matchId ? { matchId } : undefined
    });

    const list = Array.isArray(response.data) ? response.data : response.data?.patterns ?? [];
    return list.map((item: any) => ({
      id: item.id,
      matchId: String(item.match_id ?? item.matchId ?? "LIVE"),
      overNumber: safeNumber(item.over_number ?? item.overNumber, 0),
      sequence: String(item.over_signature ?? item.sequence ?? ""),
      seenCount: safeNumber(item.count ?? item.seenCount, 0),
      lastOccurrence: String(item.last_time ?? item.lastOccurrence ?? "")
    }));
  },

  async getInningPatterns(matchId?: string): Promise<InningPattern[]> {
    const response = await axiosInstance.get("/patterns/innings", {
      params: matchId ? { matchId } : undefined
    });

    const list = Array.isArray(response.data) ? response.data : response.data?.patterns ?? [];
    return list.map((item: any) => ({
      id: item.id,
      matchId: String(item.match_id ?? item.matchId ?? "LIVE"),
      sequence: toArray(item.innings_signature ?? item.sequence),
      seenCount: safeNumber(item.count ?? item.seenCount, 0),
      patternStrength: safeNumber(item.pattern_strength ?? item.patternStrength, 0),
      lastOccurrence: String(item.last_time ?? item.lastOccurrence ?? "")
    }));
  },

  async getMatchPatterns(matchId?: string): Promise<MatchPattern[]> {
    const response = await axiosInstance.get("/patterns/match", {
      params: matchId ? { matchId } : undefined
    });

    const list = Array.isArray(response.data) ? response.data : response.data?.patterns ?? [];
    return list.map((item: any) => ({
      id: item.id,
      matchId: String(item.match_id ?? item.matchId ?? "LIVE"),
      timeline: toArray(item.match_signature ?? item.timeline),
      similarityPercent: safeNumber(item.similarity_percent ?? item.similarityPercent, 0),
      seenCount: safeNumber(item.count ?? item.seenCount, 0),
      lastOccurrence: String(item.last_time ?? item.lastOccurrence ?? "")
    }));
  },

  async compareMatchPatterns(params: { matchId?: string; historyDate?: string }): Promise<MatchPatternComparison> {
    const response = await axiosInstance.get("/patterns/match/compare", {
      params: {
        ...(params.matchId ? { matchId: params.matchId } : {}),
        ...(params.historyDate ? { historyDate: params.historyDate } : {})
      }
    });

    const mapItem = (item: any): MatchPatternComparisonItem => ({
      id: item.id,
      matchId: String(item.match_id ?? item.matchId ?? "LIVE"),
      timeline: toArray(item.match_signature ?? item.timeline),
      seenCount: safeNumber(item.count ?? item.seenCount, 0),
      lastOccurrence: String(item.last_time ?? item.lastOccurrence ?? ""),
      currentSeenCount:
        item.current_count === undefined && item.currentSeenCount === undefined
          ? undefined
          : safeNumber(item.current_count ?? item.currentSeenCount, 0),
      currentLastOccurrence:
        item.current_last_time === undefined && item.currentLastOccurrence === undefined
          ? undefined
          : String(item.current_last_time ?? item.currentLastOccurrence ?? ""),
      similarityPercent: safeNumber(item.similarity_percent ?? item.similarityPercent, 100)
    });

    return {
      selectedDate: response.data?.selectedDate ? String(response.data.selectedDate) : null,
      currentMatchId: String(response.data?.currentMatchId ?? params.matchId ?? "LIVE"),
      previous: Array.isArray(response.data?.previous) ? response.data.previous.map(mapItem) : [],
      current: Array.isArray(response.data?.current) ? response.data.current.map(mapItem) : [],
      matches: Array.isArray(response.data?.matches) ? response.data.matches.map(mapItem) : []
    };
  }
};
