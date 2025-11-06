"use client"

import * as React from "react"
import { Task } from "@/types/task.type"
import { Status } from "@/types/status.interaface"
import { User } from "@/types/user.interface" // Import User type
import { Label } from "@/types/label.interface" // Import Label type
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { PriorityPicker } from "@/components/shared/PriorityPicker"
import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"
import { db } from "@/public/mock-data/mock-data" // Import db để lấy user, label
import LabelTag from "@/components/ui/LabelTag"
import { getAssigneeInitial } from "@/lib/backlog-utils"

interface KanbanCardProps {
  task: Task
  statuses: Status[] // Để hiển thị status (nếu cần) hoặc các thông tin khác
  // Bất kỳ props nào khác bạn muốn truyền vào
}

export function KanbanCard({ task, statuses }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: task.id,
    data: {
      task: task,
      type: "KANBAN_CARD", // Phân biệt loại kéo thả
    },
  });

  // Style cho hiệu ứng kéo thả
  const style = {
    transform: CSS.Translate.toString(transform),
    transition: 'transform 0s', // Tắt transition mặc định để kéo mượt hơn
  };

  // Lấy thông tin assignee và label (tương tự TaskDragOverlay)
  const assignee = task.assigneeIds?.[0] ? db.users.find(u => u.id === task.assigneeIds[0]) : null
  const labels = (task.labelIds || []).map(id => db.labels.find(l => l.id === id)).filter(Boolean) as Label[]

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners} // Gắn listener vào cả card
      className={cn(
        "mb-2 cursor-grab touch-none", // cursor-grab cho biết có thể kéo
        isDragging && "opacity-50 shadow-lg ring-2 ring-primary z-50", // Style khi đang kéo
      )}
      onClick={(e) => {
        // Ngăn không cho click vào card mở modal khi đang kéo
        if (isDragging) {
           e.stopPropagation();
           e.preventDefault();
        }
        // Gọi hàm mở modal của bạn ở đây nếu cần
        // handleRowClick?.(task) // Ví dụ
      }}
      
    >
      <CardContent className="p-3 space-y-2">
        {/* Title */}
        <p className="text-sm font-medium leading-tight">{task.title}</p>

        {/* Labels */}
        {labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {labels.map(label => (
              <LabelTag key={label.id} label={label} />
            ))}
          </div>
        )}

        {/* Priority & Assignee */}
        <div className="flex items-center justify-between pt-1">
          <PriorityPicker
             priority={task.priority}
             onPriorityChange={() => {}} // Chỉ hiển thị, không cho đổi ở đây
             disabled={true}
           />
          {assignee && (
             <Avatar className="h-6 w-6 border">
               <AvatarFallback className="text-xs">{getAssigneeInitial(assignee.id)}</AvatarFallback>
             </Avatar>
           )}
        </div>
      </CardContent>
    </Card>
  );
}