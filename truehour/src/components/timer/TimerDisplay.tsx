import TimeDisplay from "@/components/shared/TimeDisplay";

export default function TimerDisplay({ seconds }: { seconds: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">現在の計測時間</p>
      <TimeDisplay seconds={seconds} />
    </div>
  );
}
