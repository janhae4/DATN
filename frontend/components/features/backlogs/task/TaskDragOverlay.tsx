"use client";

import * as React from "react";
import { Task, List } from "@/types";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskDragOverlayProps {
  task: Task;
  lists: List[];
  selectedCount: number;
}

export function TaskDragOverlay({
  task,
  selectedCount = 0,
}: TaskDragOverlayProps) {
  const isMultiDrag = selectedCount > 1;
  console.log(
    "Rendering TaskDragOverlay for task:",
    task.id,
    "Selected Count:",
    selectedCount,
    isMultiDrag
  );
  return (
    <div className="relative w-fit cursor-grabbing scale-105 transition-transform">
      {isMultiDrag && (
        <div
          className="absolute -top-2 -right-2 z-[150] 
                        bg-red-600 text-white text-xs font-bold 
                        w-6 h-6 flex items-center justify-center rounded-full 
                        shadow-md border-2 border-background animate-in zoom-in-50 duration-200"
        >
          {selectedCount}
        </div>
      )}

      {isMultiDrag && (
        <>
        {console.log("Selected count overlay:", selectedCount)}
          <div className="absolute top-2 left-1.5 w-[19rem] h-full bg-background border rounded-lg shadow-sm -z-10" />
          {selectedCount > 1 && (
            <div className="absolute top-1 left-0.5 w-[19rem] h-full bg-background border rounded-lg shadow-sm -z-10" />
          )}
        </>
      )}
      <div
        className={cn(
          "relative z-10 flex items-center gap-2 px-4 py-3",
          "bg-background border rounded-lg shadow-xl",
          // "ring-1 ring-primary/20",
          "w-[300px]"
        )}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="text-sm font-medium truncate">{task.title}</span>
      </div>
    </div>
  );
}
