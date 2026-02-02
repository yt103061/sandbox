"use client";

import { useEffect, useState } from "react";
import { useTimer } from "@/hooks/useTimer";
import TimerButton from "./TimerButton";
import TimerDisplay from "./TimerDisplay";
import type { Task } from "@/types";

export default function Timer() {
  const { isRunning, elapsedSeconds, start, stop } = useTimer();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        const projectId = data.projects?.[0]?.id;
        if (!projectId) return;
        return fetch(`/api/projects/${projectId}/tasks`)
          .then((res) => res.json())
          .then((taskData) => setTasks(taskData.tasks ?? []));
      });
  }, []);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            タイムトラッカー
          </h3>
          <p className="text-sm text-slate-500">タスクを選択して計測を開始</p>
        </div>
        <TimerButton
          isRunning={isRunning}
          onStart={() => start(selectedTaskId || undefined)}
          onStop={stop}
        />
      </div>
      <select
        className="rounded-md border border-slate-200 px-3 py-2 text-sm"
        value={selectedTaskId}
        onChange={(event) => setSelectedTaskId(event.target.value)}
      >
        <option value="">タスクを選択</option>
        {tasks.map((task) => (
          <option key={task.id} value={task.id}>
            {task.title}
          </option>
        ))}
      </select>
      <TimerDisplay seconds={elapsedSeconds} />
    </div>
  );
}
