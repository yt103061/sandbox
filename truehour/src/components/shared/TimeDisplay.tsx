import { secondsToHMS } from "@/lib/utils/time";

export default function TimeDisplay({ seconds }: { seconds: number }) {
  return (
    <span className="font-mono text-lg font-semibold">
      {secondsToHMS(seconds)}
    </span>
  );
}
