\"use client\";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProjectStatsCard from "@/components/projects/ProjectStatsCard";
import TaskList from "@/components/tasks/TaskList";
import TaskForm from "@/components/tasks/TaskForm";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import type { Project, Task } from "@/types";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = params?.id;
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<{ totalMinutes: number; budgetMinutes: number | null }>({
    totalMinutes: 0,
    budgetMinutes: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchProject = () => {
    if (!projectId) return;
    setIsLoading(true);
    Promise.all([
      fetch(`/api/projects/${projectId}`).then((res) => res.json()),
      fetch(`/api/projects/${projectId}/tasks`).then((res) => res.json()),
    ])
      .then(([projectData, taskData]) => {
        setProject(projectData.project ?? null);
        setStats(projectData.stats ?? { totalMinutes: 0, budgetMinutes: null });
        setTasks(taskData.tasks ?? []);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!project) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
        プロジェクトが見つかりません。
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {project.name}
          </h1>
          {project.description ? (
            <p className="mt-2 text-sm text-slate-500">
              {project.description}
            </p>
          ) : null}
        </div>
        <ProjectStatsCard
          totalMinutes={stats.totalMinutes}
          budgetMinutes={stats.budgetMinutes ?? null}
          effectiveHourlyRate={project.hourlyRate ?? null}
          completionRate={
            stats.budgetMinutes
              ? Math.round((stats.totalMinutes / stats.budgetMinutes) * 100)
              : 0
          }
        />
      </div>
      <TaskForm projectId={projectId} onCreated={fetchProject} />
      <TaskList tasks={tasks} />
    </div>
  );
}
