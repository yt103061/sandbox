export default function LoadingSpinner() {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-primary" />
      読み込み中...
    </div>
  );
}
