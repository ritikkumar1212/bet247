import { useQuery } from "@tanstack/react-query";
import { patternApi } from "@/api/services/patternApi";
import { useDashboardSettings } from "@/hooks/useDashboardSettings";

export const useOverPatterns = () => {
  const { autoRefresh, matchId } = useDashboardSettings();
  return useQuery({
    queryKey: ["patterns", "overs", matchId],
    queryFn: () => patternApi.getOverPatterns(matchId),
    refetchInterval: autoRefresh ? 2000 : false
  });
};

export const useInningPatterns = () => {
  const { autoRefresh, matchId } = useDashboardSettings();
  return useQuery({
    queryKey: ["patterns", "innings", matchId],
    queryFn: () => patternApi.getInningPatterns(matchId),
    refetchInterval: autoRefresh ? 2000 : false
  });
};

export const useMatchPatterns = () => {
  const { autoRefresh, matchId } = useDashboardSettings();
  return useQuery({
    queryKey: ["patterns", "match", matchId],
    queryFn: () => patternApi.getMatchPatterns(matchId),
    refetchInterval: autoRefresh ? 2000 : false
  });
};

export const useMatchPatternComparison = (historyDate?: string) => {
  const { autoRefresh, matchId } = useDashboardSettings();
  return useQuery({
    queryKey: ["patterns", "match", "compare", matchId, historyDate],
    queryFn: () => patternApi.compareMatchPatterns({ matchId, historyDate }),
    refetchInterval: autoRefresh ? 2000 : false
  });
};
