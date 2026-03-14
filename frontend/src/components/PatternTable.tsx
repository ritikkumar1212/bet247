import { formatDateTime } from "@/utils/format";

interface PatternRow {
  id: string | number;
  sequence: string;
  seenCount: number;
  lastOccurrence: string;
  extra?: string;
}

interface PatternTableProps {
  rows: PatternRow[];
  extraColumnLabel?: string;
}

export const PatternTable = ({ rows, extraColumnLabel }: PatternTableProps) => (
  <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-glass backdrop-blur-md">
    <table className="min-w-full border-collapse text-left text-sm">
      <thead className="bg-base-900/80 text-xs uppercase tracking-wide text-slate-400">
        <tr>
          <th className="px-4 py-3">Sequence</th>
          <th className="px-4 py-3">Seen</th>
          <th className="px-4 py-3">Last Seen</th>
          {extraColumnLabel ? <th className="px-4 py-3">{extraColumnLabel}</th> : null}
        </tr>
      </thead>
      <tbody>
        {rows.length ? (
          rows.map((row) => (
            <tr key={row.id} className="border-t border-white/5 text-slate-200">
              <td className="px-4 py-3 font-mono text-xs">{row.sequence}</td>
              <td className="px-4 py-3">{row.seenCount}</td>
              <td className="px-4 py-3 text-xs text-slate-400">{formatDateTime(row.lastOccurrence)}</td>
              {extraColumnLabel ? <td className="px-4 py-3">{row.extra ?? "-"}</td> : null}
            </tr>
          ))
        ) : (
          <tr className="border-t border-white/5 text-slate-400">
            <td className="px-4 py-6 text-center" colSpan={extraColumnLabel ? 4 : 3}>
              No pattern data found.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);
