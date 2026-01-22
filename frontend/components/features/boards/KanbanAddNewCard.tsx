"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTaskManagementContext } from "@/components/providers/TaskManagementContext";
import { X } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { Task } from "@/types";
interface KanbanAddNewCardProps {
  listId: string;
  sprintId: string;
  teamId: string;
  projectId: string;
  onCancel: () => void;
}

export function KanbanAddNewCard({
  listId,
  sprintId,
  teamId,
  projectId,
  onCancel,
}: KanbanAddNewCardProps) {
  const {
    newRowTitle,
    setNewRowTitle,
    handleAddNewRow,
    setNewTaskListId,
    handleInputKeyDown,
    createTask,
  } = useTaskManagementContext();

  React.useEffect(() => {
    setNewTaskListId(listId);
    setNewRowTitle("");
  }, [listId, setNewTaskListId, setNewRowTitle]);

  const handleCreate = () => {
    if (newRowTitle.trim()) {
      const newTask = {
        title: newRowTitle,
        listId: listId,
        sprintId: sprintId || undefined,
        projectId: projectId,
        teamId: teamId,
      };
      createTask(newTask);
      setNewRowTitle("");
      onCancel();
    }
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      onCancel();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreate();
      return;
    }
    handleInputKeyDown(e, null, { onCancel });
  };

  return (
    <Card className="group/card relative border-border/40 bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/50 mb-2">
      <CardContent className="flex flex-col gap-2.5">
        <Input
          autoFocus
          placeholder="What needs to be done?"
          value={newRowTitle}
          onChange={(e) => setNewRowTitle(e.target.value)}
          onKeyDown={onKeyDown}
          className="border-none shadow-none p-0 h-auto focus-visible:ring-0 text-sm font-medium resize-none"
        />
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={onCancel}
          >
            <X className="h-4 w-4" />
          </Button>
          <Button size="sm" className="h-7 px-3 text-xs" onClick={handleCreate}>
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
