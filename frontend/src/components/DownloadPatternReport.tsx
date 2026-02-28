import { useState } from "react";

const buildEndpoints = () => {
  const baseUrl = String(import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
  const urls: string[] = [];

  if (baseUrl) {
    urls.push(`${baseUrl}/report/download`);
    if (!baseUrl.endsWith("/api")) {
      urls.push(`${baseUrl}/api/report/download`);
    } else {
      const rootUrl = baseUrl.replace(/\/api$/, "");
      urls.push(`${rootUrl}/report/download`);
    }
  }
  return [...new Set(urls)];
};

const parseError = async (response: Response) => {
  const isJson = (response.headers.get("content-type") || "").includes("application/json");
  if (!isJson) return `Request failed (${response.status})`;

  try {
    const payload = await response.json();
    return String(payload?.error || payload?.message || `Request failed (${response.status})`);
  } catch {
    return `Request failed (${response.status})`;
  }
};

const isFileResponse = (response: Response) => {
  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  const disposition = (response.headers.get("content-disposition") || "").toLowerCase();
  const isExcelType =
    contentType.includes("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") ||
    contentType.includes("application/octet-stream");
  return isExcelType || disposition.includes("attachment");
};

const getDownloadName = (response: Response) => {
  const disposition = response.headers.get("content-disposition") || "";
  const match = disposition.match(/filename\*?=(?:UTF-8'')?\"?([^\";]+)\"?/i);
  return match?.[1] || "cricket_report.xlsx";
};

export const DownloadPatternReport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDownload = async () => {
    setLoading(true);
    setError(null);

    try {
      const endpoints = buildEndpoints();
      if (endpoints.length === 0) {
        throw new Error("VITE_API_URL is not configured");
      }
      let lastError = "Download failed";
      let success = false;

      for (const endpoint of endpoints) {
        const response = await fetch(endpoint, { method: "GET" });
        if (!response.ok) {
          lastError = `${await parseError(response)} [${endpoint}]`;
          continue;
        }

        if (!isFileResponse(response)) {
          lastError = `Endpoint returned non-file response [${endpoint}]`;
          continue;
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = getDownloadName(response);
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        success = true;
        break;
      }

      if (!success) throw new Error(lastError);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onDownload}
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-4 py-2.5 text-base font-semibold text-emerald-100 transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? (
          <>
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Generating Report...
          </>
        ) : (
          "Download Pattern Report"
        )}
      </button>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </div>
  );
};
