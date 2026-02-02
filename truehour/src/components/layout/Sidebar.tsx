import Link from "next/link";

const links = [
  { href: "/dashboard", label: "ダッシュボード" },
  { href: "/projects", label: "プロジェクト" },
  { href: "/reports", label: "レポート" },
  { href: "/settings", label: "設定" },
];

export default function Sidebar() {
  return (
    <aside className="hidden w-64 flex-col gap-6 border-r border-slate-200 bg-white px-6 py-8 md:flex">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">TrueHour</h1>
        <p className="text-sm text-slate-500">AI time manager</p>
      </div>
      <nav className="grid gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            href={link.href}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="rounded-xl bg-slate-100 p-4 text-sm text-slate-600">
        <p className="font-semibold text-slate-900">Proプラン</p>
        <p className="mt-1">PDF/CSVエクスポートや詳細分析が利用できます。</p>
      </div>
    </aside>
  );
}
