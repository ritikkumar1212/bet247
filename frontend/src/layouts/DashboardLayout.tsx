import { Outlet } from "react-router-dom";
import { Sidebar } from "@/layouts/Sidebar";
import { Topbar } from "@/layouts/Topbar";
import { useRealtimeTransport } from "@/hooks/useRealtimeTransport";
import { useDashboardSettings } from "@/hooks/useDashboardSettings";

export const DashboardLayout = () => {
  const { autoRefresh } = useDashboardSettings();
  useRealtimeTransport(autoRefresh, "polling");

  return (
    <div className="min-h-screen bg-grid bg-[size:18px_18px] p-4 lg:p-6">
      <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-4 lg:grid-cols-[280px_1fr] lg:gap-6">
        <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
          <Sidebar />
        </div>

        <main className="space-y-4 lg:space-y-6">
          <Topbar />
          <div className="rounded-2xl border border-white/10 bg-base-900/50 p-4 shadow-glass backdrop-blur-xl lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
