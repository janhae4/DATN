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
import { useLists } from "@/hooks/useList";
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
  isSubtask = false
}: AddNewTaskRowProps) {
  const params = useParams();
  const projectId = params.projectId as string;

  const { createTask, isLoading } = useTasks({ projectId });

  React.useEffect(() => {
    console.log("🟢 MOUNT AddNewTaskRow");
    return () => console.log("🔴 UNMOUNT AddNewTaskRow");
  }, []);

  const [title, setTitle] = React.useState("");
  const [selectedListId, setSelectedListId] = React.useState<string>("");

  const stopPropagation = (e: React.MouseEvent | React.PointerEvent) => e.stopPropagation();

  React.useEffect(() => {
    if (lists && lists.length > 0 && !selectedListId) {
      const todoList = lists.find(
        (l) => l.category === ListCategoryEnum.TODO || l.name.toLowerCase() === "to do"
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

  return (
    <TableRow onClick={stopPropagation} className="bg-muted/10 hover:bg-muted/20">
      <TableCell className="w-full">
        {/* Style indent cho Subtask input */}
        <div className={cn("flex items-center gap-1", isSubtask ? "pl-12" : "ml-5")}>
          {isSubtask && <CornerDownRight className="h-4 w-4 text-muted-foreground mr-2" />}
          <Input
            autoFocus
            placeholder={isSubtask ? "Add a subtask..." : "Enter new task title..."}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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
      <TableCell></TableCell>

      <TableCell className="w-fit">
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleCreate} disabled={isLoading || !title.trim()}>
            {isLoading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : "Save"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onCancel?.()} disabled={isLoading}>
            Cancel
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}