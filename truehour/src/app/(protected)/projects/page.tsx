\"use client\";

import ProjectList from "@/components/projects/ProjectList";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { useProjects } from "@/hooks/useProjects";

export default function ProjectListPage() {
  const { projects, isLoading } = useProjects();

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">プロジェクト</h1>
        <p className="mt-2 text-sm text-slate-500">
          進行中のプロジェクトと進捗を管理します。
        </p>
      </div>
      {isLoading ? <LoadingSpinner /> : <ProjectList projects={projects} />}
    </div>
  );
}
