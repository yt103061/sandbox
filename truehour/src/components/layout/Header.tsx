import Link from "next/link";

export default function Header() {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <div>
        <p className="text-sm text-slate-500">Good morning</p>
        <h2 className="text-xl font-semibold text-slate-900">今日の進捗</h2>
      </div>
      <div className="flex items-center gap-3">
        <Link
          className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600"
          href="/reports/daily"
        >
          日次レポート
        </Link>
        <div className="h-9 w-9 rounded-full bg-slate-200" />
      </div>
    </header>
  );
}
