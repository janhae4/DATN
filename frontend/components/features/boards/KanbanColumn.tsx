"use client"

import * as React from "react"
import { Task } from "@/types/task.type"
import { Status } from "@/types/status.interface"
import { KanbanCard } from "./KanbanCard"
import { useDroppable } from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy, // Chiến lược sắp xếp dọc
} from "@dnd-kit/sortable";
import { ScrollArea } from "@/components/ui/scroll-area" // Để cuộn khi có nhiều task
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface KanbanColumnProps {
  status: Status // Trạng thái của cột này
  tasks: Task[] // Danh sách các task thuộc cột này
  allStatuses: Status[] // Danh sách tất cả status để truyền vào Card
}

export function KanbanColumn({ status, tasks, allStatuses }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status.id, // ID của khu vực thả chính là statusId
    data: {
      type: "KANBAN_COLUMN",
      status: status,
    },
  });

  // Lấy danh sách ID task cho SortableContext
  const taskIds = React.useMemo(() => tasks.map((t) => t.id), [tasks]);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col w-72 flex-shrink-0 bg-muted/50 rounded-lg border h-[calc(100vh-10rem)]", // Giới hạn chiều cao và cho phép co lại
         isOver ? "ring-2 ring-primary ring-offset-2" : "", // Highlight khi kéo qua
      )}
    >
      {/* Header Cột */}
      <div className="flex items-center justify-between p-3 border-b sticky top-0 bg-muted/50 rounded-t-lg z-10">
        <div className="flex items-center gap-2">
           <span
             className="h-2.5 w-2.5 rounded-full"
             style={{ backgroundColor: status.color }}
           />
           <h3 className="font-semibold text-sm">{status.name}</h3>
        </div>
        <Badge variant="secondary">{tasks.length}</Badge>
      </div>

      {/* Danh sách Task */}
      <ScrollArea className="flex-1 p-2">
        {/* Bọc danh sách card bằng SortableContext */}
         <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
           {tasks.length > 0 ? (
             tasks.map((task) => (
               <KanbanCard key={task.id} task={task} statuses={allStatuses} />
             ))
           ) : (
             <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
               No tasks yet
             </div>
           )}
         </SortableContext>
      </ScrollArea>

       {/* (Optional) Footer - Ví dụ: Nút Add Task */}
       {/* <div className="p-2 border-t">
          <Button variant="ghost" size="sm" className="w-full justify-start">
             <PlusIcon className="h-4 w-4 mr-2"/> Add Card
          </Button>
       </div> */}
    </div>
  );
}