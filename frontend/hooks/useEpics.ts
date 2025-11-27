import { useState, useEffect, useCallback } from "react";
import { Epic } from "@/types";
import { epicService } from "@/services/epicService";

export function useEpics(projectId?: string) {
  const [epics, setEpics] = useState<Epic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchEpics = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await epicService.getEpics(projectId);
      setEpics(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchEpics();
  }, [fetchEpics]);

  const createEpic = async (epic: Epic) => {
    try {
      const newEpic = await epicService.createEpic(epic);
      setEpics((prev) => [...prev, newEpic]);
      return newEpic;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const updateEpic = async (id: string, updates: Partial<Epic>) => {
    try {
      const updatedEpic = await epicService.updateEpic(id, updates);
      if (updatedEpic) {
        setEpics((prev) =>
          prev.map((e) => (e.id === id ? updatedEpic : e))
        );
      }
      return updatedEpic;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const deleteEpic = async (id: string) => {
    try {
      await epicService.deleteEpic(id);
      setEpics((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  return {
    epics,
    isLoading,
    error,
    fetchEpics,
    createEpic,
    updateEpic,
    deleteEpic,
  };
}
