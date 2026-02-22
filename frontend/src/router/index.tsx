import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "@/App";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { LivePage } from "@/pages/LivePage";
import { OversPage } from "@/pages/OversPage";
import { InningsPage } from "@/pages/InningsPage";
import { MatchPatternsPage } from "@/pages/MatchPatternsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true, element: <Navigate to="/live" replace /> },
          { path: "live", element: <LivePage /> },
          { path: "overs", element: <OversPage /> },
          { path: "innings", element: <InningsPage /> },
          { path: "match-patterns", element: <MatchPatternsPage /> },
          { path: "settings", element: <SettingsPage /> },
          { path: "*", element: <NotFoundPage /> }
        ]
      }
    ]
  }
]);
