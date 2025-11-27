"use client";

import * as React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTaskManagementContext } from "@/components/providers/TaskManagementContext";
import { List } from "@/types";
import { ListCategoryEnum } from "@/types/common/enums";

interface AddNewTaskRowProps {
  lists: List[];
  sprintId?: string;
  onCancel?: () => void;
}

export function AddNewTaskRow({
  lists,
  sprintId,
  onCancel,
}: AddNewTaskRowProps) {
  const {
    newRowTitle,
    setNewRowTitle,
    handleInputKeyDown,
    handleAddNewRow,
    newTaskListId,
    setNewTaskListId,
  } = useTaskManagementContext();

  // Helper function to prevent click propagation
  const stopPropagation = (e: React.MouseEvent | React.PointerEvent) =>
    e.stopPropagation();

  // Auto-select "To Do" list if not set or invalid
  React.useEffect(() => {
    if (lists && lists.length > 0) {
      // Check if current newTaskListId is valid (exists in lists)
      const isValidList = lists.some((l) => l.id === newTaskListId);

      if (!isValidList || newTaskListId === "todo") {
        // Find "To Do" list (by category or name) or default to first list
        const todoList =
          lists.find(
            (l) =>
              l.category === ListCategoryEnum.TODO ||
              l.name.toLowerCase() === "to do"
          ) || lists[0];
        if (todoList) {
          setNewTaskListId(todoList.id);
        }
      }
    }
  }, [lists, newTaskListId, setNewTaskListId]);

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
            value={newRowTitle}
            onChange={(e) => setNewRowTitle(e.target.value)}
            onPointerDown={stopPropagation}
            onClick={stopPropagation}
            onKeyDown={(e) =>
              handleInputKeyDown(e, null, { sprintId, onCancel })
            }
            className="h-auto p-0 px-1 bg-transparent border-none shadow-none flex-grow focus-visible:ring-0 focus:ring-0 focus:border-none focus:outline-none"
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
              handleAddNewRow(null, sprintId);
              onCancel?.();
            }}
          >
            Create
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
