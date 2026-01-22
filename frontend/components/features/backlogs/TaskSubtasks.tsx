"use client";

import * as React from "react";
import { Task, List } from "@/types";
import { useTasks } from "@/hooks/useTasks";
import { Table, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Network, Plus } from "lucide-react";
import { BacklogTaskRow } from "./task/BacklogTaskRow";
import { AddNewTaskRow } from "./task/AddNewTaskRow";
import { useTaskManagement } from "@/hooks/useTaskManagement";

interface TaskSubtasksProps {
  taskId: string;
  projectId: string;
  teamId: string;
  lists: List[];
  onRowClick: (task: Task) => void;
}

export function TaskSubtasks({
  taskId,
  teamId,
  projectId,
  lists,
  onRowClick,
}: TaskSubtasksProps) {
  const { data: tasks, updateTask } = useTaskManagement(projectId, teamId);

  const [isAdding, setIsAdding] = React.useState(false);

  const subtasks = React.useMemo(() => {
    return tasks.filter((t) => t.parentId === taskId);
  }, [tasks, taskId]);

  const handleUpdateTask = (id: string, updates: any) => {
    updateTask(id, updates);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Network className="h-4 w-4" />
        <span>Subtasks</span>
        <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs text-foreground">
          {subtasks.length}
        </span>
      </div>

      <div className="rounded-md border">
        {subtasks.length === 0 && !isAdding ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              No subtasks yet
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="mr-2 h-3 w-3" /> Add a subtask
            </Button>
          </div>
        ) : (
          <Table>
            <TableBody>
              {subtasks.map((subtask) => (
                <BacklogTaskRow
                  key={subtask.id}
                  allTasks={tasks}
                  task={subtask}
                  lists={lists}
                  isDraggable={false}
                  onRowClick={onRowClick}
                  onUpdateTask={handleUpdateTask}
                  level={0}
                />
              ))}

              {isAdding && (
                <AddNewTaskRow
                  lists={lists}
                  parentId={taskId}
                  isSubtask={true}
                  onCancel={() => setIsAdding(false)}
                />
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {subtasks.length > 0 && !isAdding && (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="mr-2 h-3 w-3" /> Add subtask
        </Button>
      )}
    </div>
  );
}
