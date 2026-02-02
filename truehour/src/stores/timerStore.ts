"use client";

import { create } from "zustand";

interface TimerState {
  isRunning: boolean;
  currentEntryId: string | null;
  taskId: string | null;
  subtaskId: string | null;
  startedAt: Date | null;
  elapsedSeconds: number;
  start: (taskId?: string, subtaskId?: string) => Promise<void>;
  stop: () => Promise<void>;
  tick: () => void;
  reset: () => void;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  isRunning: false,
  currentEntryId: null,
  taskId: null,
  subtaskId: null,
  startedAt: null,
  elapsedSeconds: 0,
  start: async (taskId, subtaskId) => {
    const response = await fetch("/api/time-entries/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, subtaskId }),
    });
    const data = await response.json();
    set({
      isRunning: true,
      taskId: taskId ?? null,
      subtaskId: subtaskId ?? null,
      startedAt: data.timeEntry?.startedAt
        ? new Date(data.timeEntry.startedAt)
        : new Date(),
      currentEntryId: data.timeEntry?.id ?? null,
      elapsedSeconds: 0,
    });
  },
  stop: async () => {
    const { currentEntryId } = get();
    if (!currentEntryId) return;
    await fetch("/api/time-entries/stop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timeEntryId: currentEntryId }),
    });
    set({ isRunning: false, currentEntryId: null, startedAt: null, elapsedSeconds: 0 });
  },
  tick: () => {
    const { startedAt } = get();
    if (!startedAt) return;
    const elapsedSeconds = Math.floor(
      (Date.now() - startedAt.getTime()) / 1000,
    );
    set({ elapsedSeconds });
  },
  reset: () => {
    set({
      isRunning: false,
      currentEntryId: null,
      taskId: null,
      subtaskId: null,
      startedAt: null,
      elapsedSeconds: 0,
    });
  },
}));
