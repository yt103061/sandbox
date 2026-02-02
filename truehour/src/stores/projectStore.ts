"use client";

import { create } from "zustand";
import type { Project } from "@/types";

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  fetchProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  createProject: (data: Partial<Project>) => Promise<void>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  fetchProjects: async () => {
    set({ isLoading: true });
    const response = await fetch("/api/projects");
    const payload = await response.json();
    set({ projects: payload.projects ?? [], isLoading: false });
  },
  fetchProject: async (id) => {
    set({ isLoading: true });
    const response = await fetch(`/api/projects/${id}`);
    const payload = await response.json();
    set({ currentProject: payload.project ?? null, isLoading: false });
  },
  createProject: async (data) => {
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },
  updateProject: async (id, data) => {
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },
  deleteProject: async (id) => {
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
  },
}));
