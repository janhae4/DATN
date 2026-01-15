"use client";

import * as React from "react";
import { TableBody } from "@/components/ui/table";
import { Task, List } from "@/types";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { UpdateTaskDto } from "@/services/taskService";
import { BacklogTaskRow } from "./BacklogTaskRow";

type TaskRowListProps = {
  tasks: Task[];
  allTasks: Task[];
  lists: List[];
  isDraggable?: boolean;
  isSortable?: boolean;
  onRowClick: (task: Task) => void;
  onUpdateTask: (taskId: string, updates: UpdateTaskDto) => void;
  children?: React.ReactNode;
  selectedIds?: string[];
  onSelect?: (taskId: string, checked: boolean) => void;
  onMultiSelectChange: (ids: string[]) => void;
  onDeleteTask?: (taskId: string) => void;
};

export function TaskRowList({
  tasks,
  allTasks,
  lists,
  isDraggable = false,
  isSortable = false,
  onRowClick,
  onUpdateTask,
  children,
  selectedIds = [],
  onSelect,
  onMultiSelectChange,
  onDeleteTask,
}: TaskRowListProps) {
  const [anchorId, setAnchorId] = React.useState<string | null>(null);
  const [initialSnapshot, setInitialSnapshot] = React.useState<string[]>([]);
  const anchorIdRef = React.useRef<string | null>(null);
  const initialSnapshotRef = React.useRef<string[]>([]);
  const isLockedRef = React.useRef(false);
  const isDraggingSelection = anchorId !== null;

  const handleStartSelection = (startId: string) => {
    isLockedRef.current = true;

    anchorIdRef.current = startId;
    initialSnapshotRef.current = selectedIds;
    setAnchorId(startId);
    setInitialSnapshot(selectedIds);

    if (!selectedIds.includes(startId)) {
      onSelect?.(startId, true);
    }

    if ((window as any)._lockTimeout)
      clearTimeout((window as any)._lockTimeout);

    (window as any)._lockTimeout = setTimeout(() => {
      isLockedRef.current = false;
    }, 500);
  };

  React.useEffect(() => {
    const handleGlobalUp = (e: Event) => {
      if (isLockedRef.current) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (!anchorIdRef.current) return;

      anchorIdRef.current = null;
      initialSnapshotRef.current = [];
      setAnchorId(null);
      setInitialSnapshot([]);
    };

    const preventScroll = (e: TouchEvent) => {
      if (anchorIdRef.current && e.cancelable) {
        e.preventDefault();
      }
    };

    window.addEventListener("mouseup", handleGlobalUp);
    window.addEventListener("touchend", handleGlobalUp);
    window.addEventListener("pointerup", handleGlobalUp);
    window.addEventListener("pointercancel", handleGlobalUp);
    window.addEventListener("lostpointercapture", handleGlobalUp);

    document.addEventListener("touchmove", preventScroll, { passive: false });

    return () => {
      window.removeEventListener("mouseup", handleGlobalUp);
      window.removeEventListener("touchend", handleGlobalUp);
      window.removeEventListener("pointerup", handleGlobalUp);
      window.removeEventListener("pointercancel", handleGlobalUp);
      window.removeEventListener("lostpointercapture", handleGlobalUp);
      document.removeEventListener("touchmove", preventScroll);
    };
  }, []);

  const handleMoveSelection = (currentId: string) => {
    const currentAnchor = anchorIdRef.current;
    if (!currentAnchor) return;

    const sourceList = allTasks && allTasks.length > 0 ? allTasks : tasks;
    const startIndex = sourceList.findIndex((t: any) => t.id === currentAnchor);
    const currentIndex = sourceList.findIndex((t: any) => t.id === currentId);

    if (startIndex === -1 || currentIndex === -1) return;

    const min = Math.min(startIndex, currentIndex);
    const max = Math.max(startIndex, currentIndex);
    const idsInRange = sourceList.slice(min, max + 1).map((t: any) => t.id);

    const newSelectedSet = new Set([
      ...initialSnapshotRef.current,
      ...idsInRange,
    ]);

    if (newSelectedSet.size !== selectedIds.length) {
      onMultiSelectChange?.(Array.from(newSelectedSet));
    }
  };

  const preventScroll = (e: TouchEvent) => {
    if (anchorIdRef.current && e.cancelable) {
      e.preventDefault();
    }
  };
  document.addEventListener("touchmove", preventScroll, { passive: false });

  const taskRows = tasks.map((task) => (
    <BacklogTaskRow
      key={task.id}
      allTasks={allTasks}
      task={task}
      lists={lists}
      isDraggable={isDraggable}
      onRowClick={onRowClick}
      selected={selectedIds.includes(task.id)}
      onSelect={onSelect}
      onUpdateTask={onUpdateTask}
      onDeleteTask={onDeleteTask}
      isSelectionDragging={isDraggingSelection}
      onStartSelection={() => handleStartSelection(task.id)}
      onMoveSelection={() => handleMoveSelection(task.id)}
      data-sortable={isSortable}
    />
  ));

  if (isSortable) {
    const taskIds = tasks.map((task) => task.id);
    return (
      <TableBody data-sortable={true}>
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {taskRows}
          {children &&
            React.Children.map(children, (child) =>
              React.isValidElement(child)
                ? React.cloneElement(child, { "data-sortable": false } as any)
                : child
            )}
        </SortableContext>
      </TableBody>
    );
  }

  return (
    <TableBody data-sortable={false}>
      {taskRows}
      {children}
    </TableBody>
  );
}
