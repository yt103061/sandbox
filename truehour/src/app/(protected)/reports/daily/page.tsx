"use client";

import { useEffect, useState } from "react";
import DailyReport from "@/components/reports/DailyReport";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import type { TimeEntry } from "@/types";

export default function DailyReportPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/daily")
      .then((res) => res.json())
      .then((data) => setEntries(data.entries ?? []))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">日次レポート</h1>
        <p className="mt-2 text-sm text-slate-500">今日の稼働実績</p>
      </div>
      {isLoading ? <LoadingSpinner /> : <DailyReport entries={entries} />}
    </div>
  );
}
