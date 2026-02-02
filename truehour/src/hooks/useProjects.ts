"use client";

import { useEffect } from "react";
import { useProjectStore } from "@/stores/projectStore";

export function useProjects() {
  const store = useProjectStore();

  useEffect(() => {
    store.fetchProjects();
  }, [store]);

  return store;
}
