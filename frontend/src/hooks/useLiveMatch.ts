import { useQuery } from "@tanstack/react-query";
import { matchApi } from "@/api/services/matchApi";
import { useDashboardSettings } from "@/hooks/useDashboardSettings";

export const useLiveMatch = () => {
  const { autoRefresh, matchId } = useDashboardSettings();

  return useQuery({
    queryKey: ["live-match", matchId],
    queryFn: () => matchApi.getLiveMatch(matchId),
    refetchInterval: autoRefresh ? 2000 : false
  });
};

export const useMatchesByDate = (date: string) =>
  useQuery({
    queryKey: ["matches-by-date", date],
    queryFn: () => matchApi.getMatchesByDate(date),
    enabled: Boolean(date)
  });

export const useMatchDetails = (matchId?: string) =>
  useQuery({
    queryKey: ["match-details", matchId],
    queryFn: () => matchApi.getMatchDetails(String(matchId)),
    enabled: Boolean(matchId)
  });
