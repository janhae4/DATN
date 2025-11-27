import { useState, useEffect, useCallback } from "react";
import { Task } from "@/types";
import { taskService } from "@/services/taskService";

export function useTasks(projectId?: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!projectId) {
      setTasks([]);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const data = await taskService.getTasks(projectId);
      setTasks(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = async (task: Task) => {
    try {
      const newTask = await taskService.createTask(task);
      setTasks((prev) => [...prev, newTask]);
      return newTask;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const updatedTask = await taskService.updateTask(id, updates);
      if (updatedTask) {
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? updatedTask : t))
        );
      }
      return updatedTask;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await taskService.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  return {
    tasks,
    isLoading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
  };
}
