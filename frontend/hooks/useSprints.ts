import { useState, useEffect, useCallback } from "react";
import { Sprint } from "@/types";
import { sprintService } from "@/services/sprintService";

export function useSprints(projectId?: string) {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSprints = useCallback(async () => {
    if (!projectId) {
      setSprints([]);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const data = await sprintService.getSprints(projectId);
      setSprints(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchSprints();
  }, [fetchSprints]);

  const createSprint = async (sprint: Sprint) => {
    try {
      const newSprint = await sprintService.createSprint(sprint);
      setSprints((prev) => [...prev, newSprint]);
      return newSprint;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const updateSprint = async (id: string, updates: Partial<Sprint>) => {
    try {
      const updatedSprint = await sprintService.updateSprint(id, updates);
      if (updatedSprint) {
        setSprints((prev) =>
          prev.map((s) => (s.id === id ? updatedSprint : s))
        );
      }
      return updatedSprint;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const deleteSprint = async (id: string) => {
    try {
      await sprintService.deleteSprint(id);
      setSprints((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  return {
    sprints,
    isLoading,
    error,
    fetchSprints,
    createSprint,
    updateSprint,
    deleteSprint,
  };
}
