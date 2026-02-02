export default function MobileNav() {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
      <span className="text-base font-semibold">TrueHour</span>
      <button className="rounded-md border border-slate-200 px-3 py-1 text-sm">
        メニュー
      </button>
    </div>
  );
}
