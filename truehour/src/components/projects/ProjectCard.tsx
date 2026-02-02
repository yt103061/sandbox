import type { Project } from "@/types";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-base font-semibold text-slate-900">
        {project.name}
      </h3>
      {project.description ? (
        <p className="mt-2 text-sm text-slate-500">{project.description}</p>
      ) : null}
      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <span>{project.status}</span>
        <span>{project.budgetMinutes ? `${project.budgetMinutes}分` : "予算未設定"}</span>
      </div>
    </div>
  );
}
