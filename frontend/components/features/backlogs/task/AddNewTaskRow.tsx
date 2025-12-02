"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { List } from "@/types";
import { ListCategoryEnum } from "@/types/common/enums";
import { useTasks } from "@/hooks/useTasks"; // 1. Import Hook
import { CreateTaskDto } from "@/services/taskService"; // Import DTO
import { useLists } from "@/hooks/useList";

interface AddNewTaskRowProps {
  lists: List[];
  sprintId?: string;
  onCancel?: () => void;
}

export function AddNewTaskRow({  sprintId,
  onCancel,
}: AddNewTaskRowProps) {
  const params = useParams();
  const projectId = params.projectId as string;

  const { createTask, isLoading } = useTasks(projectId);
  const { lists } = useLists(projectId);

  const [title, setTitle] = React.useState("");
  const [selectedListId, setSelectedListId] = React.useState<string>("");

  // Helper function to prevent click propagation
  const stopPropagation = (e: React.MouseEvent | React.PointerEvent) =>
    e.stopPropagation();

  // Auto-select "To Do" list
  React.useEffect(() => {
    if (lists && lists.length > 0 && !selectedListId) {
      const todoList =
        lists.find(
          (l) =>
            l.category === ListCategoryEnum.TODO ||
            l.name.toLowerCase() === "to do"
        ) || lists[0];
      if (todoList) {
        setSelectedListId(todoList.id);
      }
    }
  }, [lists, selectedListId]);

  // 5. Hàm xử lý tạo Task
  const handleCreate = async () => {
    if (!title.trim() || !projectId || !selectedListId) return;

    try {
      const newTaskPayload: CreateTaskDto = {
        title: title.trim(),
        projectId: projectId,
        listId: selectedListId,
        sprintId: sprintId || undefined, 
      };

      console.log("Creating task with payload:", newTaskPayload);


      await createTask(newTaskPayload);
      
      setTitle("");
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreate();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setTitle("");
      onCancel?.();
    }
  };

  return (
    <TableRow
      onClick={stopPropagation}
      className="bg-muted/10 hover:bg-muted/20"
    >
      <TableCell className="w-full">
        <div className="flex items-center gap-1 ml-5">
          <Input
            autoFocus
            placeholder="Enter new task title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onPointerDown={stopPropagation}
            onClick={stopPropagation}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="h-auto p-0 px-1 bg-transparent border-none shadow-none flex-grow focus-visible:ring-0 focus:ring-0 focus:border-none focus:outline-none placeholder:text-muted-foreground/50"
          />
        </div>
      </TableCell>

      <TableCell></TableCell>
      <TableCell></TableCell>
      <TableCell></TableCell>
      <TableCell></TableCell>

      <TableCell className="w-fit">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleCreate();
            }}
            disabled={isLoading || !title.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Saving
              </>
            ) : (
              "Create"
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onCancel?.();
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}