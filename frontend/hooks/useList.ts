import { useState, useEffect, useCallback } from "react";
import { List } from "@/types";
import { listService } from "@/services/listService";

export function useList(projectId?: string) {
  const [lists, setLists] = useState<List[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLists = useCallback(async () => {
    if (!projectId) {
      setLists([]);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const data = await listService.getLists(projectId);
      setLists(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const createList = async (listData: Pick<List, "name" | "category">) => {
    if (!projectId) return;

    const newList: List = {
      id: `list-${Date.now()}`,
      name: listData.name,
      position: lists.length + 1,
      color: "#A1A1AA", // Default color
      projectId: projectId,
      category: listData.category,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const createdList = await listService.createList(newList);
      setLists((prev) => [...prev, createdList]);
      return createdList;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const updateList = async (id: string, updates: Partial<List>) => {
    try {
      const updatedList = await listService.updateList(id, updates);
      if (updatedList) {
        setLists((prev) =>
          prev.map((l) => (l.id === id ? updatedList : l))
        );
      }
      return updatedList;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const deleteList = async (id: string) => {
    try {
      await listService.deleteList(id);
      setLists((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const reorderLists = async (newLists: List[]) => {
      // Optimistic update
      setLists(newLists);
      try {
          if (projectId) {
             await listService.reorderLists(projectId, newLists);
          }
      } catch (err) {
          setError(err as Error);
          // Revert if failed (optional, but good practice)
          fetchLists();
      }
  }

  return {
    lists,
    isLoading,
    error,
    fetchLists,
    createList,
    updateList,
    deleteList,
    reorderLists
  };
}
