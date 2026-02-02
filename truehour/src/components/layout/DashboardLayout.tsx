import Link from "next/link";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex w-full flex-col">
        <Header />
        <main className="flex-1 px-6 py-8">{children}</main>
        <footer className="border-t border-slate-200 px-6 py-4 text-sm text-slate-500">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>© 2026 TrueHour</span>
            <Link className="text-primary" href="/settings">
              設定
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
