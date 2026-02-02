import { formatCurrencyJPY } from "@/lib/utils/format";
import { formatDuration } from "@/lib/utils/time";

interface ProjectStatsCardProps {
  totalMinutes: number;
  budgetMinutes: number | null;
  effectiveHourlyRate: number | null;
  completionRate: number;
}

export default function ProjectStatsCard({
  totalMinutes,
  budgetMinutes,
  effectiveHourlyRate,
  completionRate,
}: ProjectStatsCardProps) {
  const budgetPercent = budgetMinutes
    ? Math.round((totalMinutes / budgetMinutes) * 100)
    : null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-slate-900">プロジェクト統計</h3>
      <div className="mt-4 grid gap-3 text-sm text-slate-600">
        <div className="flex items-center justify-between">
          <span>累計稼働</span>
          <span className="font-semibold text-slate-900">
            {formatDuration(totalMinutes)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>予算消化</span>
          <span className="font-semibold text-slate-900">
            {budgetPercent ? `${budgetPercent}%` : "未設定"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>実効時給</span>
          <span className="font-semibold text-slate-900">
            {effectiveHourlyRate ? formatCurrencyJPY(effectiveHourlyRate) : "-"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>完了率</span>
          <span className="font-semibold text-slate-900">{completionRate}%</span>
        </div>
      </div>
    </div>
  );
}
