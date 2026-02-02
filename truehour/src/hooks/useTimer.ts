"use client";

import { useEffect } from "react";
import { useTimerStore } from "@/stores/timerStore";

export function useTimer() {
  const store = useTimerStore();

  useEffect(() => {
    if (!store.isRunning) return;
    const interval = setInterval(store.tick, 1000);
    return () => clearInterval(interval);
  }, [store.isRunning, store.tick]);

  return store;
}
