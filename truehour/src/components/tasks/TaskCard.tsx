import Link from "next/link";
import type { Task } from "@/types";

export default function TaskCard({ task }: { task: Task }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <Link
          className="text-base font-semibold text-slate-900 hover:underline"
          href={`/tasks/${task.id}`}
        >
          {task.title}
        </Link>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
          {task.status}
        </span>
      </div>
      {task.description ? (
        <p className="mt-2 text-sm text-slate-500">{task.description}</p>
      ) : null}
    </div>
  );
}
