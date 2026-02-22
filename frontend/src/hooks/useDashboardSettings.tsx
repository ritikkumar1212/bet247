import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

interface DashboardSettings {
  autoRefresh: boolean;
  setAutoRefresh: (value: boolean) => void;
  matchId: string;
  setMatchId: (value: string) => void;
}

const DashboardSettingsContext = createContext<DashboardSettings | null>(null);

export const DashboardSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [matchId, setMatchId] = useState("LIVE");

  const value = useMemo(
    () => ({ autoRefresh, setAutoRefresh, matchId, setMatchId }),
    [autoRefresh, matchId]
  );

  return <DashboardSettingsContext.Provider value={value}>{children}</DashboardSettingsContext.Provider>;
};

export const useDashboardSettings = () => {
  const context = useContext(DashboardSettingsContext);
  if (!context) {
    throw new Error("useDashboardSettings must be used inside DashboardSettingsProvider");
  }
  return context;
};
