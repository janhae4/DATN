"use client";

import * as React from "react";
import { Task, List } from "@/types";
import { useTasks } from "@/hooks/useTasks";
import { Table, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Network, Plus } from "lucide-react";
import { BacklogTaskRow } from "./task/BacklogTaskRow";
import { AddNewTaskRow } from "./task/AddNewTaskRow";

interface TaskSubtasksProps {
  taskId: string;
  projectId: string;
  teamId: string;
  lists: List[];
  onRowClick: (task: Task) => void;
}

export function TaskSubtasks({
  taskId,
  teamId,
  projectId,
  lists,
  onRowClick,
}: TaskSubtasksProps) {
  // 1. Lấy dữ liệu từ hook
  const { tasks, updateTask } = useTasks({ projectId, teamId });

  // 2. State cho việc thêm mới
  const [isAdding, setIsAdding] = React.useState(false);

  // 3. Lọc ra các Subtasks của Task hiện tại
  const subtasks = React.useMemo(() => {
    return tasks.filter((t) => t.parentId === taskId);
  }, [tasks, taskId]);

  // Handler update task
  const handleUpdateTask = (id: string, updates: any) => {
    updateTask(id, updates);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Network className="h-4 w-4" />
        <span>Subtasks</span>
        <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs text-foreground">
          {subtasks.length}
        </span>
      </div>

      <div className="rounded-md border">
        {/* Nếu không có subtask và không đang thêm mới -> Hiển thị Empty State gọn */}
        {subtasks.length === 0 && !isAdding ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              No subtasks yet
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="mr-2 h-3 w-3" /> Add a subtask
            </Button>
          </div>
        ) : (
          <Table>
            <TableBody>
              {/* Danh sách Subtasks */}
              {subtasks.map((subtask) => (
                <BacklogTaskRow
                  key={subtask.id}
                  allTasks={tasks}
                  task={subtask}
                  lists={lists}
                  // Trong Modal thì tắt kéo thả để tránh xung đột
                  isDraggable={false}
                  onRowClick={onRowClick} // Click vào subtask sẽ mở modal của subtask đó
                  onUpdateTask={handleUpdateTask}
                  level={0} // Trong modal hiển thị phẳng, không cần thụt lề quá nhiều
                />
              ))}

              {/* Form thêm mới */}
              {isAdding && (
                <AddNewTaskRow
                  lists={lists}
                  parentId={taskId}
                  isSubtask={true}
                  onCancel={() => setIsAdding(false)}
                />
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Nút thêm mới (nếu đang có list và chưa mở form) */}
      {subtasks.length > 0 && !isAdding && (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="mr-2 h-3 w-3" /> Add subtask
        </Button>
      )}
    </div>
  );
}
