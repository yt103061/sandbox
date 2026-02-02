import type { TimeEntry } from "@/types";

export default function DailyReport({ entries }: { entries: TimeEntry[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-slate-900">今日の記録</h3>
      {entries.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">今日の記録はまだありません。</p>
      ) : (
        <ul className="mt-4 grid gap-3 text-sm">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between">
              <span>{entry.note ?? "作業"}</span>
              <span className="text-slate-500">
                {entry.durationMinutes ?? 0}分
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
