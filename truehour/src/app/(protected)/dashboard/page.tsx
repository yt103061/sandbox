"use client";

import { useEffect, useState } from "react";
import Timer from "@/components/timer/Timer";
import EstimateIndicator from "@/components/shared/EstimateIndicator";
import DailyReport from "@/components/reports/DailyReport";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import type { TimeEntry } from "@/types";

export default function DashboardPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [note, setNote] = useState("");
  const [startedAt, setStartedAt] = useState("");
  const [endedAt, setEndedAt] = useState("");

  const fetchEntries = () => {
    const today = new Date().toISOString().split("T")[0];
    setIsLoading(true);
    fetch(`/api/time-entries?startDate=${today}&endDate=${today}`)
      .then((res) => res.json())
      .then((data) => setEntries(data.timeEntries ?? []))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const totalMinutes = entries.reduce(
    (sum, entry) => sum + (entry.durationMinutes ?? 0),
    0,
  );

  const handleManualEntry = () => {
    if (!startedAt || !endedAt) return;
    fetch("/api/time-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startedAt, endedAt, note }),
    }).then(() => {
      setNote("");
      setStartedAt("");
      setEndedAt("");
      fetchEntries();
    });
  };

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Timer />
        <EstimateIndicator estimatedMinutes={300} actualMinutes={totalMinutes} />
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900">手動入力</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
            placeholder="開始 (YYYY-MM-DDTHH:mm)"
            type="datetime-local"
            value={startedAt}
            onChange={(event) => setStartedAt(event.target.value)}
          />
          <input
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
            placeholder="終了 (YYYY-MM-DDTHH:mm)"
            type="datetime-local"
            value={endedAt}
            onChange={(event) => setEndedAt(event.target.value)}
          />
          <input
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
            placeholder="メモ"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </div>
        <button
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white"
          onClick={handleManualEntry}
          type="button"
        >
          登録
        </button>
      </div>
      {isLoading ? <LoadingSpinner /> : <DailyReport entries={entries} />}
    </div>
  );
}
