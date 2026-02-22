import { useEffect, useMemo } from "react";
import { PollingAdapter, SocketAdapter } from "@/utils/realtime";

export const useRealtimeTransport = (enabled: boolean, mode: "polling" | "socket" = "polling") => {
  const adapter = useMemo(
    () => (mode === "socket" ? new SocketAdapter() : new PollingAdapter()),
    [mode]
  );

  useEffect(() => {
    if (!enabled) return;
    adapter.connect();
    return () => adapter.disconnect();
  }, [enabled, adapter]);
};
