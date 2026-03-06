import { useState } from "react";

const REQUEST_TIMEOUT_MS = 45000;

const buildEndpoints = () => {
  const baseUrl = String(import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
  const urls: string[] = [];

  if (baseUrl) {
    if (baseUrl.endsWith("/api")) {
      urls.push(`${baseUrl}/report/download`);
    } else {
      urls.push(`${baseUrl}/api/report/download`);
      urls.push(`${baseUrl}/report/download`);
    }
  }
  return [...new Set(urls)];
};

const parseError = async (response: Response) => {
  const isJson = (response.headers.get("content-type") || "").includes("application/json");
  if (!isJson) return `Request failed (${response.status})`;

  try {
    const payload = await response.json();
    const base = String(payload?.error || payload?.message || `Request failed (${response.status})`);
    const details = payload?.details ? `: ${String(payload.details)}` : "";
    return `${base}${details}`;
  } catch {
    return `Request failed (${response.status})`;
  }
};

const fetchWithTimeout = async (url: string, timeoutMs: number) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { method: "GET", signal: controller.signal });
  } finally {
    window.clearTimeout(timeoutId);
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
  const [info, setInfo] = useState<string | null>(null);

  const onDownload = async () => {
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const endpoints = buildEndpoints();
      if (endpoints.length === 0) {
        throw new Error("VITE_API_URL is not configured");
      }
      let lastError = "Download failed";
      let success = false;

      for (const endpoint of endpoints) {
        let response: Response;
        try {
          response = await fetchWithTimeout(endpoint, REQUEST_TIMEOUT_MS);
        } catch (requestError) {
          if (requestError instanceof DOMException && requestError.name === "AbortError") {
            lastError = `Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s [${endpoint}]`;
            continue;
          }
          throw requestError;
        }

        if (!response.ok) {
          lastError = `${await parseError(response)} [${endpoint}]`;
          continue;
        }

        if (!isFileResponse(response)) {
          lastError = `Endpoint returned non-file response [${endpoint}]`;
          continue;
        }

        const blob = await response.blob();
        if (!blob || blob.size === 0) {
          lastError = `Received empty file [${endpoint}]`;
          continue;
        }
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = getDownloadName(response);
        document.body.appendChild(a);
        a.click();
        a.remove();
        // Delay revoke to avoid race where browser cancels download.
        window.setTimeout(() => window.URL.revokeObjectURL(url), 5000);
        success = true;
        setInfo(`Download started (${a.download})`);
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
            Generating Report (up to {REQUEST_TIMEOUT_MS / 1000}s)...
          </>
        ) : (
          "Download Pattern Report"
        )}
      </button>
      {info ? <p className="text-sm text-emerald-300">{info}</p> : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </div>
  );
};
