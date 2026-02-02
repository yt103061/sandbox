\"use client\";

import ProjectForm from "@/components/projects/ProjectForm";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { useEffect, useState } from "react";

export default function ProjectCreatePage() {
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/clients")
      .then((res) => res.json())
      .then((data) => setClients(data.clients ?? []))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">新規プロジェクト</h1>
        <p className="mt-2 text-sm text-slate-500">
          クライアントと予算を設定して管理を開始します。
        </p>
      </div>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <ProjectForm clients={clients} />
      )}
    </div>
  );
}
