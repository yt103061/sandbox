"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

interface TaskFormValues {
  title: string;
  description?: string;
}

export default function TaskForm({
  projectId,
  onCreated,
}: {
  projectId?: string;
  onCreated?: () => void;
}) {
  const { register, handleSubmit, reset } = useForm<TaskFormValues>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = (data: TaskFormValues) => {
    if (!projectId) return;
    setIsSubmitting(true);
    fetch(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then(() => {
        reset();
        onCreated?.();
      })
      .finally(() => setIsSubmitting(false));
  };

  return (
    <form
      className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4"
      onSubmit={handleSubmit(onSubmit)}
    >
      <input
        className="rounded-md border border-slate-200 px-3 py-2 text-sm"
        placeholder="タスク名"
        {...register("title", { required: true })}
      />
      <textarea
        className="rounded-md border border-slate-200 px-3 py-2 text-sm"
        placeholder="詳細"
        rows={3}
        {...register("description")}
      />
      <button
        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white"
        type="submit"
      >
        {isSubmitting ? "追加中..." : "タスク追加"}
      </button>
    </form>
  );
}
