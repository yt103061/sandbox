"use client";

import { useEffect, useState } from "react";
import type { TimeEntry } from "@/types";

export function useTimeEntries() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetch("/api/time-entries")
      .then((res) => res.json())
      .then((data) => setEntries(data.timeEntries ?? []))
      .finally(() => setIsLoading(false));
  }, []);

  return { entries, isLoading };
}
