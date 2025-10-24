"use client"

import * as React from "react"
import { KanbanCard } from "./KanbanCard" // Cần cho DragOverlay
import {
  DndContext,
  DragEndEvent,
  DragOverEvent, // Dùng để xác định đang kéo qua cột nào
  DragStartEvent,
  DragOverlay,
  closestCorners, // Chiến lược phát hiện va chạm phù hợp hơn cho board
  PointerSensor, // Sử dụng PointerSensor thay vì MouseSensor/TouchSensor
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { Task } from "@/lib/dto/task.type"
import { Status } from "@/lib/dto/status.interaface"
import { useTaskManagementContext } from "@/components/providers/TaskManagementContext"
import { statusesForProject1 } from "@/lib/utils/backlog-utils" // Lấy danh sách status
import { KanbanColumn } from "./KanbanColumn";

export function KanbanBoard() {
  const { data, handleStatusChange, handleDragEnd: contextHandleDragEnd } = useTaskManagementContext()
  const statuses = statusesForProject1 // Lấy danh sách cột từ mock data hoặc API

  // State để quản lý task đang được kéo (cho DragOverlay)
  const [activeTask, setActiveTask] = React.useState<Task | null>(null)
  // State để quản lý ID của cột mà task đang được kéo qua
  const [overColumnId, setOverColumnId] = React.useState<string | null>(null);

  // Cấu hình Sensors để kéo thả mượt hơn, tránh click nhầm
   const sensors = useSensors(
     useSensor(PointerSensor, {
       // Yêu cầu di chuyển 10px trước khi bắt đầu kéo
       activationConstraint: {
         distance: 10,
       },
     })
   );

  // Nhóm tasks theo statusId
  const tasksByStatus = React.useMemo(() => {
    const grouped: { [key: string]: Task[] } = {}
    statuses.forEach(status => {
      grouped[status.id] = [] // Khởi tạo mảng rỗng cho mỗi status
    })
    data.forEach(task => {
      const statusId = task.statusId || statuses[0]?.id // Mặc định vào cột đầu tiên nếu không có statusId
      if (statusId && grouped[statusId]) {
         grouped[statusId].push(task)
      } else if (statuses[0]?.id) {
         // Nếu statusId không hợp lệ, đẩy vào cột đầu tiên
         grouped[statuses[0].id].push(task)
      }
    })
    return grouped
  }, [data, statuses])

  // Lấy danh sách ID của các cột (status)
  const columnIds = React.useMemo(() => statuses.map((s) => s.id), [statuses]);

  // Xử lý khi bắt đầu kéo
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === "KANBAN_CARD") {
       setActiveTask(active.data.current.task as Task);
       setOverColumnId(active.data.current.task.statusId); // Lưu cột ban đầu
    }
  };

   // Xử lý khi kéo qua một khu vực khác
   const handleDragOver = (event: DragOverEvent) => {
     const { over } = event;
     const overId = over?.id;

     // Chỉ cập nhật nếu đang kéo qua một cột khác
     if (overId && columnIds.includes(overId as string)) {
       setOverColumnId(overId as string);
     } else if (over?.data?.current?.type === "KANBAN_CARD") {
       // Nếu kéo qua một card khác, lấy status của card đó
       setOverColumnId(over?.data?.current?.task.statusId);
     }
   };

  // Xử lý khi kết thúc kéo
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveTask(null); // Luôn xóa activeTask
    setOverColumnId(null); // Reset cột đang kéo qua

    if (!over) return; // Không thả vào đâu cả

    const activeId = active.id as string;
    const overId = over.id as string;
    const activeTaskData = active.data.current?.task as Task | undefined;

    // --- Logic chính: Cập nhật Status ---
    // Kiểm tra xem có thả vào một cột (droppable column) khác không
    const overIsColumn = over.data.current?.type === "KANBAN_COLUMN";
    const overIsCard = over.data.current?.type === "KANBAN_CARD";

    if (activeTaskData && (overIsColumn || overIsCard)) {
       const targetStatusId = overIsColumn
         ? overId // Thả vào cột
         : (over.data.current?.task as Task).statusId; // Thả vào thẻ -> lấy status của thẻ đó

       const originalStatusId = activeTaskData.statusId;

       // Chỉ gọi cập nhật nếu status thay đổi
       if (targetStatusId && targetStatusId !== originalStatusId) {
         console.log(`Moving task ${activeId} to status ${targetStatusId}`);
         handleStatusChange(activeId, targetStatusId);
       }
     }
      // Bạn có thể thêm logic sắp xếp lại task trong cùng cột ở đây nếu muốn
      // dùng `arrayMove` nếu thả card lên card khác trong cùng 1 cột
     else {
        // Nếu không thả vào cột/card hợp lệ hoặc logic khác, có thể gọi handler gốc (nếu có)
        // contextHandleDragEnd?.(event);
        console.log("Drag ended, but not on a valid column/card or status didn't change.");
     }
  };


  return (
    <DndContext
       sensors={sensors} // Sử dụng sensor đã cấu hình
       collisionDetection={closestCorners} // Chiến lược va chạm
       onDragStart={handleDragStart}
       onDragOver={handleDragOver} // Thêm handler này
       onDragEnd={handleDragEnd}
       onDragCancel={() => { setActiveTask(null); setOverColumnId(null); }} // Xử lý khi hủy kéo
     >
      <div className="flex gap-4 p-4 overflow-x-auto h-full"> {/* Cho phép cuộn ngang */}
        {/* Bọc các cột bằng SortableContext nếu muốn sắp xếp cột */}
        {/* <SortableContext items={columnIds}> */}
          {statuses.map((status) => (
            <KanbanColumn
              key={status.id}
              status={status}
              tasks={tasksByStatus[status.id] || []}
              allStatuses={statuses}
            />
          ))}
        {/* </SortableContext> */}
      </div>

       {/* Overlay để hiển thị card đang kéo */}
       <DragOverlay dropAnimation={null}>
         {activeTask ? (
           <KanbanCard task={activeTask} statuses={statuses} />
         ) : null}
       </DragOverlay>
     </DndContext>
  );
}