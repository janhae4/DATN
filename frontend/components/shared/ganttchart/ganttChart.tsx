import React from "react";
import { Task, ViewMode, Gantt } from "gantt-task-react";
import {
  mapProjectTasksToGanttTasks,
} from "./helper";
import "gantt-task-react/dist/index.css";
import { ViewSwitcher } from "@/components/shared/ganttchart/view-switcher";
import { useTasks } from "@/hooks/useTasks";
import { useParams } from "next/navigation";
import { TaskDetailModal } from "@/components/features/backlogs/taskmodal";
import { Task as AppTask } from "@/types";
import { useLists } from "@/hooks/useList";
import { useProject } from "@/hooks/useProjects";
import { toast } from "sonner";
import { TaskFilters } from "@/hooks/useTaskManagement";
import { useDebounce } from "@/hooks/useDebounce";
import { GetTasksParams } from "@/services/taskService";

const GanttPage = () => {
  const [view, setView] = React.useState<ViewMode>(ViewMode.Day);
  const params = useParams();
  const rawProjectId = params.projectId as unknown as
    | string
    | string[]
    | undefined;
  const projectId = Array.isArray(rawProjectId)
    ? rawProjectId[0]
    : rawProjectId;

  const [filters, setFilters] = React.useState<TaskFilters>({
    searchText: "",
    assigneeIds: [],
    priorities: [],
    listIds: [],
    epicIds: [],
    labelIds: [],
    sprintIds: [],
  });
  const [expandedProjectIds, setExpandedProjectIds] = React.useState<Record<string, boolean>>({});
  const [debouncedSearch] = useDebounce(filters.searchText, 500);

  const apiParams: GetTasksParams = React.useMemo(
    () => ({
      projectId: projectId as string,
      search: debouncedSearch,
      assigneeIds:
        filters.assigneeIds.length > 0 ? filters.assigneeIds : undefined,
      priority: filters.priorities.length > 0 ? filters.priorities : undefined,
      statusId: filters.listIds.length > 0 ? filters.listIds : undefined,
      epicId: filters.epicIds.length > 0 ? filters.epicIds : undefined,
      labelIds: filters.labelIds.length > 0 ? filters.labelIds : undefined,
      sprintId: filters.sprintIds.length > 0 ? filters.sprintIds : undefined,
      limit: 50,
    }),
    [projectId, debouncedSearch, filters]
  );

  const {
    updateTask,
    deleteTask,
    tasks: projectTasks,
    isFetching: isLoading,
  } = useTasks(apiParams);

  const { lists } = useLists(projectId);
  const { project } = useProject(projectId || "");

  const [selectedTask, setSelectedTask] = React.useState<AppTask | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const ganttTasks = React.useMemo(() => {
    const mapped = mapProjectTasksToGanttTasks(projectTasks || []);
    return mapped.map(t => ({
      ...t,
      hideChildren: t.type === 'project' ? !!expandedProjectIds[t.id] : t.hideChildren
    }));
  }, [projectTasks, expandedProjectIds]);

  const [isChecked, setIsChecked] = React.useState(true);

  // Calculate column width based on view mode
  let columnWidth = 65;
  if (view === ViewMode.Year) {
    columnWidth = 350;
  } else if (view === ViewMode.Month) {
    columnWidth = 300;
  } else if (view === ViewMode.Week) {
    columnWidth = 250;
  }

  const handleTaskChange = async (task: Task) => {
    // Call API - Optimistic update is already handled by useTasks mutation
    try {
      await updateTask(task.id, {
        startDate: task.start.toISOString(),
        dueDate: task.end.toISOString(),
      });
    } catch (error) {
      console.error("Failed to update task", error);
      toast.error("Failed to update task date");
    }
  };

  const handleTaskDelete = async (task: Task) => {
    const conf = window.confirm("Are you sure about " + task.name + " ?");
    if (conf) {
      try {
        await deleteTask(task.id);
        toast.success("Task deleted");
      } catch (err) {
        console.error(err);
        toast.error("Failed to delete task");
      }
    }
    return conf;
  };

  const handleDblClick = (task: Task) => {
    const originalTask = projectTasks?.find((t) => t.id === task.id);
    if (originalTask) {
      setSelectedTask(originalTask);
      setIsModalOpen(true);
    }
  };

  const handleClick = (task: Task) => {
    // Handle click if needed
  };

  const handleSelect = (task: Task, isSelected: boolean) => {
    // Handle select if needed
  };

  const handleExpanderClick = (task: Task) => {
    setExpandedProjectIds(prev => ({
      ...prev,
      [task.id]: !prev[task.id]
    }));
  };

  // Modal Handlers
  const handleModalClose = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) setSelectedTask(null);
  };

  // ... (Giữ nguyên các handler update task khác: handleListChange, handleDateChange, etc.)
  const handleListChange = (taskId: string, listId: string) =>
    updateTask(taskId, { listId });
  const handleDateChange = (taskId: string, newDate: Date | undefined) =>
    updateTask(taskId, { dueDate: newDate?.toISOString() ?? null });
  const handlePriorityChange = (
    taskId: string,
    priority: AppTask["priority"]
  ) => updateTask(taskId, { priority });
  const handleAssigneeChange = (taskId: string, assigneeIds: string[]) =>
    updateTask(taskId, { assigneeIds });
  const handleTitleChange = (
    taskId: string,
    columnId: "title",
    value: string
  ) => updateTask(taskId, { title: value });
  const handleDescriptionChange = (taskId: string, description: string) =>
    updateTask(taskId, { description });
  const handleLabelsChange = (taskId: string, labelIds: string[]) =>
    updateTask(taskId, { labelIds });

  // --- RENDER LOGIC ---

  if (isLoading) {
    return <div className="p-4">Loading tasks...</div>; // Có thể thay bằng Skeleton UI
  }

  return (
    <div id="gantt-chart-view" className="Wrapper h-full flex flex-col">
      <style
        dangerouslySetInnerHTML={{
          __html: `
                        ._3_ygE{ border-top-left-radius: 10px; }
                        ._CZjuD{ border-radius: 10px; }
                        ._1nBOt{ display: flex; align-items: center; justify-content: center; flex-direction: row; }
                        ._1nBOt > *{ display: flex; font-weight: bold; align-items: center; justify-content: center; flex-direction: row; }
                    `,
        }}
      />

      {/* View Switcher luôn hiển thị để user có thể tương tác (tạo task mới, đổi view) */}
      <ViewSwitcher
        onViewModeChange={(viewMode) => setView(viewMode)}
        onViewListChange={setIsChecked}
        isChecked={isChecked}
        currentViewMode={view}
        searchQuery={filters.searchText}
        onSearchQueryChange={(query) => setFilters(prev => ({ ...prev, searchText: query }))}
      />

      {/* LOGIC FIX: Chỉ hiển thị Gantt nếu có tasks */}
      <div className="flex-1 overflow-hidden">
        {ganttTasks.length > 0 ? (
          <Gantt
            tasks={ganttTasks}
            viewMode={view}
            onDateChange={handleTaskChange}
            onDelete={handleTaskDelete}
            onDoubleClick={handleDblClick}
            onClick={handleClick}
            onSelect={handleSelect}
            onExpanderClick={handleExpanderClick}
            listCellWidth={isChecked ? "155px" : ""}
            columnWidth={columnWidth}
            rowHeight={50}
            barFill={65}
            barCornerRadius={4}
            barProgressColor="#3b82f6"
            barProgressSelectedColor="#1d4ed8"
            barBackgroundColor="black"
            projectProgressColor="#10b981"
            projectBackgroundColor="#d1fae5"
            fontFamily="roboto"
            fontSize="12px"
          />
        ) : (
          // Empty State UI
          <div className="flex flex-col items-center justify-center h-[400px] text-gray-500 border rounded-lg m-4 bg-gray-50">
            <p className="text-lg font-medium">No tasks found</p>
            <p className="text-sm">
              Create a new task to view the Gantt chart.
            </p>
          </div>
        )}
      </div>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          open={isModalOpen}
          onOpenChange={handleModalClose}
          lists={lists}
          onListChange={handleListChange}
          onDateChange={handleDateChange}
          onPriorityChange={handlePriorityChange}
          onAssigneeChange={handleAssigneeChange}
          onTitleChange={handleTitleChange}
          onDescriptionChange={handleDescriptionChange}
          onLabelsChange={handleLabelsChange}
          updateTask={updateTask}
        />
      )}
    </div>
  );
};

export default GanttPage;
