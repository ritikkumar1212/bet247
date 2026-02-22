import { axiosInstance } from "@/api/axiosInstance";
import type { InningPattern, MatchPattern, OverPattern } from "@/types";
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
  }
};
