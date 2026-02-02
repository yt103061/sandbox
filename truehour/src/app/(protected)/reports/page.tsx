"use client";

import { useEffect, useState } from "react";
import TimeChart from "@/components/reports/TimeChart";
import ProjectReport from "@/components/reports/ProjectReport";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import type { Project } from "@/types";

export default function ReportsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        setProjects(data.projects ?? []);
        if (data.projects?.[0]) {
          setSelectedId(data.projects[0].id);
        }
      });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setIsLoading(true);
    fetch(`/api/reports/project/${selectedId}`)
      .then((res) => res.json())
      .then((data) => setReport(data))
      .finally(() => setIsLoading(false));
  }, [selectedId]);

  const handleExport = async () => {
    if (!selectedId) return;
    const start = new Date();
    start.setDate(start.getDate() - 7);
    const end = new Date();
    const response = await fetch(
      `/api/reports/export?projectId=${selectedId}&startDate=${start.toISOString().split("T")[0]}&endDate=${end.toISOString().split("T")[0]}&format=pdf`,
    );
    const data = await response.json();
    setDownloadUrl(data.downloadUrl ?? null);
  };

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">レポート</h1>
        <p className="mt-2 text-sm text-slate-500">
          稼働時間と収益を把握し、改善点を見つけましょう。
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        {projects.length === 0 ? (
          <p className="text-sm text-slate-500">
            プロジェクトがありません。まずはプロジェクトを作成してください。
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <select
                className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                value={selectedId}
                onChange={(event) => setSelectedId(event.target.value)}
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <button
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white"
                onClick={handleExport}
                type="button"
              >
                PDFエクスポート
              </button>
            </div>
            {downloadUrl ? (
              <p className="mt-3 text-sm text-slate-500">
                ダウンロードURL:{" "}
                <a className="text-primary underline" href={downloadUrl}>
                  {downloadUrl}
                </a>
              </p>
            ) : null}
          </>
        )}
      </div>
      {isLoading ? (
        <LoadingSpinner />
      ) : report?.project ? (
        <ProjectReport project={report.project} report={report} />
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
          プロジェクトが見つかりません。
        </div>
      )}
      <TimeChart />
    </div>
  );
}
