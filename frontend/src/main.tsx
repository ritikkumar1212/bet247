import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { queryClient } from "@/utils/queryClient";
import { router } from "@/router";
import { DashboardSettingsProvider } from "@/hooks/useDashboardSettings";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <DashboardSettingsProvider>
        <RouterProvider router={router} />
      </DashboardSettingsProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
