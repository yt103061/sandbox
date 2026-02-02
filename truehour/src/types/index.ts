export type ProjectStatus = "ACTIVE" | "COMPLETED" | "ARCHIVED";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface User {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  defaultHourlyRate?: number | null;
}

export interface Client {
  id: string;
  name: string;
  email?: string | null;
  company?: string | null;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  budgetMinutes?: number | null;
  deadline?: string | null;
  hourlyRate?: number | null;
  client?: Client | null;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: Priority;
  userEstimatedMinutes?: number | null;
}

export interface Subtask {
  id: string;
  title: string;
  orderIndex: number;
  estimatedMinutes: number;
  isCompleted: boolean;
}

export interface TimeEntry {
  id: string;
  startedAt: string;
  endedAt?: string | null;
  durationMinutes?: number | null;
  note?: string | null;
}
