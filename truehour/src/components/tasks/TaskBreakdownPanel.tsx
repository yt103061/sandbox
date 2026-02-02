"use client";

import { useEffect, useState } from "react";
import SubtaskItem from "./SubtaskItem";
import type { Subtask } from "@/types";

export default function TaskBreakdownPanel({
  taskId,
  initialSubtasks = [],
}: {
  taskId: string;
  initialSubtasks?: Subtask[];
}) {
  const [subtasks, setSubtasks] = useState<Subtask[]>(initialSubtasks);
  const [isLoading, setIsLoading] = useState(false);
  const [confidence, setConfidence] = useState<number | null>(null);

  useEffect(() => {
    setSubtasks(initialSubtasks);
  }, [initialSubtasks]);

  const handleBreakdown = async () => {
    setIsLoading(true);
    const response = await fetch(`/api/tasks/${taskId}/breakdown`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ regenerate: true }),
    });
    const data = await response.json();
    setSubtasks(data.subtasks ?? []);
    setConfidence(data.confidence ?? null);
    setIsLoading(false);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">AI内訳</h3>
          <p className="text-sm text-slate-500">
            タスクを分解し、見積もり時間を提案します。
          </p>
        </div>
        <button
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white"
          onClick={handleBreakdown}
          type="button"
        >
          {isLoading ? "生成中..." : "AIで分解"}
        </button>
      </div>
      {confidence !== null ? (
        <p className="mt-2 text-xs text-slate-500">
          信頼度: {(confidence * 100).toFixed(0)}%
        </p>
      ) : null}
      <div className="mt-4 grid gap-2">
        {subtasks.length === 0 ? (
          <p className="text-sm text-slate-500">
            まだ内訳がありません。AIで分解してください。
          </p>
        ) : (
          subtasks.map((subtask) => (
            <SubtaskItem key={subtask.id} subtask={subtask} />
          ))
        )}
      </div>
    </div>
  );
}
