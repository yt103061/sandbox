"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import TaskBreakdownPanel from "@/components/tasks/TaskBreakdownPanel";
import EstimateIndicator from "@/components/shared/EstimateIndicator";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import type { Subtask, Task } from "@/types";

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const taskId = params?.id;
  const [task, setTask] = useState<Task | null>(null);
  const [actualMinutes, setActualMinutes] = useState(0);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!taskId) return;
    setIsLoading(true);
    fetch(`/api/tasks/${taskId}`)
      .then((res) => res.json())
      .then((data) => {
        setTask(data.task ?? null);
        setSubtasks(data.subtasks ?? []);
        const total = (data.timeEntries ?? []).reduce(
          (sum: number, entry: { durationMinutes?: number }) =>
            sum + (entry.durationMinutes ?? 0),
          0,
        );
        setActualMinutes(total);
      })
      .finally(() => setIsLoading(false));
  }, [taskId]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!task || !taskId) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
        タスクが見つかりません。
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{task.title}</h1>
        {task.description ? (
          <p className="mt-2 text-sm text-slate-500">{task.description}</p>
        ) : null}
      </div>
      <EstimateIndicator
        estimatedMinutes={task.userEstimatedMinutes ?? 0}
        actualMinutes={actualMinutes}
      />
      <TaskBreakdownPanel taskId={taskId} initialSubtasks={subtasks} />
    </div>
  );
}
