"use client";

import { useEffect, useState } from "react";
import type { Task } from "@/types";

export function useTasks(projectId?: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    setIsLoading(true);
    fetch(`/api/projects/${projectId}/tasks`)
      .then((res) => res.json())
      .then((data) => setTasks(data.tasks ?? []))
      .finally(() => setIsLoading(false));
  }, [projectId]);

  return { tasks, isLoading };
}
