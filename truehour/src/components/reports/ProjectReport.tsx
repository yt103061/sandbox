import type { Project } from "@/types";
import ProjectStatsCard from "@/components/projects/ProjectStatsCard";

interface ProjectReportProps {
  project: Project;
  report: {
    actualMinutes: number;
    budgetMinutes: number | null;
    effectiveHourlyRate: number | null;
  };
}

export default function ProjectReport({ project, report }: ProjectReportProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900">{project.name}</h3>
        <p className="mt-2 text-sm text-slate-500">
          進捗と予算の消化状況を確認できます。
        </p>
      </div>
      <ProjectStatsCard
        totalMinutes={report.actualMinutes}
        budgetMinutes={report.budgetMinutes}
        effectiveHourlyRate={report.effectiveHourlyRate}
        completionRate={
          report.budgetMinutes
            ? Math.round((report.actualMinutes / report.budgetMinutes) * 100)
            : 0
        }
      />
    </div>
  );
}
