"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

export default function SettingsPage() {
  const [user, setUser] = useState<{ email?: string; id?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setUser(data.user ?? null))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">設定</h1>
        <p className="mt-2 text-sm text-slate-500">
          アカウントや通知設定を管理します。
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid gap-2">
            <p>ログイン中: {user?.email ?? "未ログイン"}</p>
            <p>ユーザーID: {user?.id ?? "-"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
