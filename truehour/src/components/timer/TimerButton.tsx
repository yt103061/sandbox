interface TimerButtonProps {
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
}

export default function TimerButton({
  isRunning,
  onStart,
  onStop,
}: TimerButtonProps) {
  return (
    <button
      className={`rounded-md px-4 py-2 text-sm font-semibold text-white ${
        isRunning ? "bg-red-500" : "bg-primary"
      }`}
      onClick={isRunning ? onStop : onStart}
      type="button"
    >
      {isRunning ? "停止" : "開始"}
    </button>
  );
}
