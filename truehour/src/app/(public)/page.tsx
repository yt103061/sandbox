import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="bg-white">
      <section className="mx-auto flex max-w-5xl flex-col items-start gap-6 px-6 py-20">
        <p className="rounded-full bg-muted px-4 py-1 text-sm font-semibold text-slate-600">
          TrueHour
        </p>
        <h1 className="text-4xl font-semibold leading-tight text-slate-900 md:text-5xl">
          AI time management for freelancers with client transparency
        </h1>
        <p className="max-w-2xl text-lg text-slate-600">
          タスクの見積もり精度を上げ、透明なレポートでクライアントと信頼を
          築きます。進捗と稼働を一つのダッシュボードで管理しましょう。
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-white shadow"
            href="/signup"
          >
            無料で始める
          </Link>
          <Link
            className="rounded-md border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700"
            href="/login"
          >
            ログイン
          </Link>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "見積もりの精度向上",
              body: "AIが過去実績をもとにタスク時間を予測します。",
            },
            {
              title: "タイマーで自動記録",
              body: "作業開始・停止で稼働をリアルタイムに記録。",
            },
            {
              title: "透明なレポート",
              body: "日次・プロジェクト別のレポートを即時共有。",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-slate-800">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
