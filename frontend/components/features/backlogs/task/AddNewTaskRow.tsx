"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Loader2, CornerDownRight } from "lucide-react"; // Import icon mới

import { TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { List } from "@/types";
import { ListCategoryEnum } from "@/types/common/enums";
import { useTasks } from "@/hooks/useTasks";
import { CreateTaskDto } from "@/services/taskService";
import { cn } from "@/lib/utils";

interface AddNewTaskRowProps {
  lists: List[];
  sprintId?: string;
  epicId?: string | null;
  parentId?: string;
  onCancel?: () => void;
  isSubtask?: boolean;
}

export function AddNewTaskRow({
  lists,
  sprintId,
  parentId,
  epicId,
  onCancel,
  isSubtask = false,
}: AddNewTaskRowProps) {
  const params = useParams();
  const projectId = params.projectId as string;
  const teamId = params.teamId as string;

  const { createTask, isLoading } = useTasks({ projectId, teamId });
  const [title, setTitle] = React.useState("");
  const [selectedListId, setSelectedListId] = React.useState<string>("");
  const [isFocused, setIsFocused] = React.useState(false);

  const stopPropagation = (e: React.MouseEvent | React.PointerEvent) =>
    e.stopPropagation();

  React.useEffect(() => {
    if (lists && lists.length > 0 && !selectedListId) {
      const todoList =
        lists.find(
          (l) =>
            l.category === ListCategoryEnum.TODO ||
            l.name.toLowerCase() === "to do"
        ) || lists[0];
      if (todoList) setSelectedListId(todoList.id);
    }
  }, [lists, selectedListId]);

  const handleCreate = async () => {
    if (!title.trim() || !projectId || !selectedListId) return;
    try {
      const newTaskPayload: CreateTaskDto = {
        title: title.trim(),
        projectId: projectId,
        listId: selectedListId,
        sprintId: sprintId || undefined,
        parentId: parentId || undefined,
        epicId: epicId || undefined,
        teamId: teamId,
      };

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

  const handleBlur = () => {
    // Nếu chưa có chữ, tự động ẩn row
    if (!title.trim()) {
      onCancel?.();
    }
    setIsFocused(false);
  };

  return (
    <TableRow
      onClick={stopPropagation}
      className="bg-muted/10 hover:bg-muted/20"
    >
      <TableCell className="w-full">
        {/* Style indent cho Subtask input */}
        <div
          className={cn(
            "flex items-center gap-1",
            isSubtask ? "pl-12" : "ml-5"
          )}
        >
          {isSubtask && (
            <CornerDownRight className="h-4 w-4 text-muted-foreground mr-2" />
          )}
          <Input
            autoFocus
            placeholder={
              isSubtask ? "Add a subtask..." : "Enter new task title..."
            }
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            disabled={isLoading}
            className="h-auto p-0 px-1 bg-transparent border-none shadow-none flex-grow focus-visible:ring-0 focus:ring-0 focus:border-none focus:outline-none placeholder:text-muted-foreground/30"
          />
        </div>
      </TableCell>

      <TableCell></TableCell>
      <TableCell></TableCell>
      <TableCell></TableCell>
      <TableCell></TableCell>
      <TableCell></TableCell>

      <TableCell className="w-fit">
        <div className={cn(
          "flex items-center gap-2 transition-all duration-200",
          isFocused || title.trim() ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2 pointer-events-none"
        )}>
          <Button
            size="sm"
            className="h-7 text-xs px-3"
            onClick={handleCreate}
            onMouseDown={(e) => e.preventDefault()} // Ngăn việc mất focus input khi click
            disabled={isLoading || !title.trim()}
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              "Save"
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setTitle("");
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
