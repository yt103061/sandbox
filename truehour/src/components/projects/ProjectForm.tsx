"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

interface ProjectFormValues {
  name: string;
  description?: string;
  clientId?: string;
  budgetMinutes?: number;
  hourlyRate?: number;
}

export default function ProjectForm({
  clients = [],
  onCreated,
}: {
  clients?: { id: string; name: string }[];
  onCreated?: () => void;
}) {
  const { register, handleSubmit, reset } = useForm<ProjectFormValues>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = (data: ProjectFormValues) => {
    setIsSubmitting(true);
    fetch("/api/projects", {
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
        placeholder="プロジェクト名"
        {...register("name", { required: true })}
      />
      <textarea
        className="rounded-md border border-slate-200 px-3 py-2 text-sm"
        placeholder="概要"
        rows={3}
        {...register("description")}
      />
      <select
        className="rounded-md border border-slate-200 px-3 py-2 text-sm"
        {...register("clientId")}
      >
        <option value="">クライアント未設定</option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.name}
          </option>
        ))}
      </select>
      <input
        className="rounded-md border border-slate-200 px-3 py-2 text-sm"
        placeholder="予算（分）"
        type="number"
        {...register("budgetMinutes", { valueAsNumber: true })}
      />
      <input
        className="rounded-md border border-slate-200 px-3 py-2 text-sm"
        placeholder="時給（円）"
        type="number"
        {...register("hourlyRate", { valueAsNumber: true })}
      />
      <button
        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white"
        type="submit"
      >
        {isSubmitting ? "作成中..." : "プロジェクト作成"}
      </button>
    </form>
  );
}
