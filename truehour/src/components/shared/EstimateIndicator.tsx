import { formatDuration } from "@/lib/utils/time";

interface EstimateIndicatorProps {
  estimatedMinutes: number;
  actualMinutes: number;
}

export default function EstimateIndicator({
  estimatedMinutes,
  actualMinutes,
}: EstimateIndicatorProps) {
  const percent = estimatedMinutes
    ? Math.min(100, Math.round((actualMinutes / estimatedMinutes) * 100))
    : 0;
  const isOverrun = actualMinutes > estimatedMinutes;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>見積もり</span>
        <span>{formatDuration(estimatedMinutes)}</span>
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
        <div
          className={`h-2 rounded-full ${
            isOverrun ? "bg-red-400" : "bg-primary"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="text-slate-600">実績: {formatDuration(actualMinutes)}</span>
        {isOverrun ? (
          <span className="font-semibold text-red-500">超過中</span>
        ) : (
          <span className="text-slate-500">進行中</span>
        )}
      </div>
    </div>
  );
}
