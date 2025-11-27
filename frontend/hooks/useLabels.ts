import { useState, useEffect, useCallback } from "react";
import { Label } from "@/types";
import { labelService } from "@/services/labelService";

export function useLabels() {
  const [labels, setLabels] = useState<Label[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLabels = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await labelService.getLabels();
      setLabels(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  const createLabel = async (label: Label) => {
    try {
      const newLabel = await labelService.createLabel(label);
      setLabels((prev) => [...prev, newLabel]);
      return newLabel;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const updateLabel = async (id: string, updates: Partial<Label>) => {
    try {
      const updatedLabel = await labelService.updateLabel(id, updates);
      if (updatedLabel) {
        setLabels((prev) =>
          prev.map((l) => (l.id === id ? updatedLabel : l))
        );
      }
      return updatedLabel;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const deleteLabel = async (id: string) => {
    try {
      await labelService.deleteLabel(id);
      setLabels((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  return {
    labels,
    isLoading,
    error,
    fetchLabels,
    createLabel,
    updateLabel,
    deleteLabel,
  };
}
