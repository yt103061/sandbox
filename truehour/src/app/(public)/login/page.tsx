"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      setError("ログインに失敗しました。入力内容を確認してください。");
      setIsLoading(false);
      return;
    }
    router.push("/dashboard");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow">
        <h1 className="text-2xl font-semibold text-slate-900">ログイン</h1>
        <p className="mt-2 text-sm text-slate-500">
          TrueHourへようこそ。メールアドレスでログインしてください。
        </p>
        <form className="mt-6 grid gap-4" onSubmit={(event) => event.preventDefault()}>
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
            onClick={handleLogin}
            type="button"
          >
            {isLoading ? "ログイン中..." : "ログイン"}
          </button>
        </form>
        <p className="mt-6 text-sm text-slate-500">
          まだアカウントがありませんか？{" "}
          <Link className="font-semibold text-primary" href="/signup">
            新規登録
          </Link>
        </p>
      </div>
    </main>
  );
}
