import type { Subtask } from "@/types";

export default function SubtaskItem({ subtask }: { subtask: Subtask }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm">
      <span>{subtask.title}</span>
      <span className="text-slate-500">{subtask.estimatedMinutes}分</span>
    </div>
  );
}
