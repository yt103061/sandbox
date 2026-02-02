"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    setIsLoading(true);
    setError(null);
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    if (!response.ok) {
      setError("登録に失敗しました。入力内容を確認してください。");
      setIsLoading(false);
      return;
    }
    router.push("/dashboard");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow">
        <h1 className="text-2xl font-semibold text-slate-900">無料で始める</h1>
        <p className="mt-2 text-sm text-slate-500">
          TrueHourに登録してタスク管理をスタートしましょう。
        </p>
        <form className="mt-6 grid gap-4" onSubmit={(event) => event.preventDefault()}>
          <label className="grid gap-2 text-sm text-slate-700">
            名前
            <input
              className="rounded-md border border-slate-200 px-3 py-2"
              type="text"
              placeholder="山田 太郎"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className="grid gap-2 text-sm text-slate-700">
            メールアドレス
            <input
              className="rounded-md border border-slate-200 px-3 py-2"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="grid gap-2 text-sm text-slate-700">
            パスワード
            <input
              className="rounded-md border border-slate-200 px-3 py-2"
              type="password"
              placeholder="8文字以上"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          <button
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white"
            onClick={handleSignup}
            type="button"
          >
            {isLoading ? "作成中..." : "アカウント作成"}
          </button>
        </form>
        <p className="mt-6 text-sm text-slate-500">
          すでにアカウントがありますか？{" "}
          <Link className="font-semibold text-primary" href="/login">
            ログイン
          </Link>
        </p>
      </div>
    </main>
  );
}
