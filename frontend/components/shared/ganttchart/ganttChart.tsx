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
import { useGanttTour } from "@/hooks/touring/useGanttTour";
import { useTheme } from "next-themes";
import { BaseTaskFilterDto } from "@/services/taskService";

const GanttPage = () => {
  const { theme, resolvedTheme } = useTheme();
  // We use resolvedTheme to also support 'system' preference
  const isDark = (theme === "dark" || resolvedTheme === "dark");

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
  const { startTour } = useGanttTour();

  const apiParams: BaseTaskFilterDto = React.useMemo(
    () => ({
      teamId: params.teamId as string,
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

  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const selectedTask = React.useMemo(() => {
    if (!selectedTaskId) return null;
    return projectTasks?.find((t) => t.id === selectedTaskId) || null;
  }, [projectTasks, selectedTaskId]);

  const ganttTasks = React.useMemo(() => {
    const mapped = mapProjectTasksToGanttTasks(projectTasks || []);
    return mapped.map(t => ({
      ...t,
      hideChildren: t.type === 'project' ? !!expandedProjectIds[t.id] : t.hideChildren
    }));
  }, [projectTasks, expandedProjectIds]);

  const [isChecked, setIsChecked] = React.useState(true);

  let columnWidth = 65;
  if (view === ViewMode.Year) {
    columnWidth = 350;
  } else if (view === ViewMode.Month) {
    columnWidth = 300;
  } else if (view === ViewMode.Week) {
    columnWidth = 250;
  }

  const ganttColors = React.useMemo(() => {
    if (isDark) {
      return {
        barBackgroundColor: "#52525b",
        barBackgroundSelectedColor: "#71717a",
        barProgressColor: "#3b82f6",
        barProgressSelectedColor: "#60a5fa",
        projectBackgroundColor: "#065f46",
        projectBackgroundSelectedColor: "#064e3b",
        projectProgressColor: "#34d399",
        projectProgressSelectedColor: "#10b981",
        arrowColor: "#a1a1aa",
      };
    }
    return {
      barBackgroundColor: "black",
      barBackgroundSelectedColor: "#9ca3af",
      barProgressColor: "#3b82f6",
      barProgressSelectedColor: "#1d4ed8",
      projectBackgroundColor: "#d1fae5",
      projectBackgroundSelectedColor: "#a7f3d0",
      projectProgressColor: "#10b981",
      projectProgressSelectedColor: "#059669",
      arrowColor: undefined,
    };
  }, [isDark]);

  const handleTaskChange = async (task: Task) => {
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
    setSelectedTaskId(task.id);
    setIsModalOpen(true);
  };

  const handleClick = (task: Task) => {
    setSelectedTaskId(task.id);
    setIsModalOpen(true);
  };

  const handleSelect = (task: Task, isSelected: boolean) => {
    // Selection in Gantt chart
  };

  const handleTaskSelect = (task: AppTask) => {
    setSelectedTaskId(task.id);
    setIsModalOpen(true);
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
    if (!open) setSelectedTaskId(null);
  };

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
  const handleEpicChange = (taskId: string, epicId: string | null) =>
    updateTask(taskId, { epicId });


  if (isLoading) {
    return <div className="p-4">Loading tasks...</div>;
  }

  return (
    <div className="Wrapper h-full flex flex-col">
      <style
        dangerouslySetInnerHTML={{
          __html: `
                        ._3_ygE{ border-top-left-radius: 10px; }
                        ._CZjuD{ border-radius: 10px; }
                        ._1nBOt{ display: flex; align-items: center; justify-content: center; flex-direction: row; }
                        ._1nBOt > *{ display: flex; font-weight: bold; align-items: center; justify-content: center; flex-direction: row; }
                        
                        /* Dark Mode Overrides for Gantt Chart */
                        ${isDark ? `
                          .gantt-task-react-header {
                            fill: #27272a; /* zinc-800 */
                            stroke: #3f3f46; /* zinc-700 */
                          }
                          .gantt-task-react-grid-row {
                            fill: #18181b; /* zinc-950 */
                            stroke: #27272a; /* zinc-800 */
                          }
                           .gantt-task-react-grid-row:nth-child(even) {
                            fill: #09090b; /* zinc-950 darker */
                          }
                          .gantt-task-react-today-highlight {
                            fill: rgba(255, 255, 255, 0.05);
                          }
                          text {
                            fill: #e4e4e7 !important; /* zinc-200 */
                          }
                          .gantt-task-react-task-list-header {
                             color: #e4e4e7;
                             background-color: #18181b !important;
                             border-bottom: 1px solid #27272a;
                          }
                          /* Fix for task list table background */
                          ._2k9Ys { background-color: #18181b !important; color: #e4e4e7 !important; }
                        ` : ''}
                    `,
        }}
      />

      <ViewSwitcher
        onViewModeChange={(viewMode) => setView(viewMode)}
        onViewListChange={setIsChecked}
        isChecked={isChecked}
        currentViewMode={view}
        searchQuery={filters.searchText}
        onSearchQueryChange={(query) => setFilters(prev => ({ ...prev, searchText: query }))}
        onStartTour={startTour}
      />

      <div id="gantt-chart-container" className="flex-1">
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
            {...ganttColors}
            fontFamily="inherit"
            fontSize="12px"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-[400px] text-gray-500 border rounded-lg m-4 bg-gray-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400">
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
          onTaskSelect={handleTaskSelect}
          updateTask={updateTask}
        />
      )}
    </div>
  );
};

export default GanttPage;
