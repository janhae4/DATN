import React, { useState } from "react";
import { Task, ViewMode, Gantt } from "gantt-task-react";
import { getStartEndDateForProject, mapProjectTasksToGanttTasks } from "./helper";
import "gantt-task-react/dist/index.css";
import { ViewSwitcher } from "@/components/shared/ganttchart/view-switcher";
import { useTasks } from "@/hooks/useTasks";
import { useParams } from "next/navigation";
import { TaskDetailModal } from "@/components/features/backlogs/taskmodal";
import { Task as AppTask } from "@/types";
import { useLists } from "@/hooks/useList";
import { useProject } from "@/hooks/useProjects";
import { useTeamMembers } from "@/hooks/useTeam";
import { toast } from "sonner";

const GanttPage = () => {
    const [view, setView] = React.useState<ViewMode>(ViewMode.Day);
    const params = useParams();
    const [searchQuery, setSearchQuery] = useState('');
    const rawProjectId = params.projectId as unknown as string | string[] | undefined;
    const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;

    // Hooks
    const { tasks: projectTasks, isLoading, updateTask, deleteTask } = useTasks(projectId);
    const { lists } = useLists(projectId);
    const { project } = useProject(projectId || "");
    const { data: members } = useTeamMembers(project?.teamId || null);

    // State
    const [selectedTask, setSelectedTask] = React.useState<AppTask | null>(null);
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    // Memoize gantt tasks transformation
    const ganttTasks = React.useMemo(
        () => mapProjectTasksToGanttTasks(projectTasks || []), // Fallback empty array
        [projectTasks]
    );

    const [tasks, setTasks] = React.useState<Task[]>(ganttTasks);
    const [isChecked, setIsChecked] = React.useState(true);

    // Sync local tasks when server data changes
    React.useEffect(() => {
        setTasks(ganttTasks);
    }, [ganttTasks]);

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
        // Optimistic update locally
        let newTasks = tasks.map((t) => (t.id === task.id ? task : t));
        
        // Update parent project task logic
        if (task.project) {
            const projectTaskIndex = newTasks.findIndex((t) => t.id === task.project);
            if (projectTaskIndex !== -1) {
                const [start, end] = getStartEndDateForProject(newTasks, task.project);
                const project = newTasks[projectTaskIndex];
                if (
                    project.start.getTime() !== start.getTime() ||
                    project.end.getTime() !== end.getTime()
                ) {
                    const changedProject = { ...project, start, end };
                    newTasks = newTasks.map((t) =>
                        t.id === task.project ? changedProject : t
                    );
                }
            }
        }
        setTasks(newTasks);

        // Call API
        try {
            await updateTask(task.id, {
                startDate: task.start.toISOString(),
                dueDate: task.end.toISOString(),
            });
        } catch (error) {
            console.error("Failed to update task", error);
            toast.error("Failed to update task date");
            // Nên revert lại state cũ ở đây nếu cần thiết
            setTasks(tasks); // Revert to old state
        }
    };

    const handleTaskDelete = (task: Task) => {
        const conf = window.confirm("Are you sure about " + task.name + " ?");
        if (conf) {
            setTasks(tasks.filter((t) => t.id !== task.id));
            deleteTask(task.id)
                .then(() => toast.success("Task deleted"))
                .catch((err) => {
                    console.error(err);
                    toast.error("Failed to delete task");
                    // Re-fetch logic or revert state handled by parent query usually
                });
        }
        return conf;
    };

    const handleDblClick = (task: Task) => {
        const originalTask = projectTasks?.find(t => t.id === task.id);
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
        setTasks(tasks.map((t) => (t.id === task.id ? task : t)));
    };

    // Modal Handlers
    const handleModalClose = (open: boolean) => {
        setIsModalOpen(open);
        if (!open) setSelectedTask(null);
    };

    // ... (Giữ nguyên các handler update task khác: handleListChange, handleDateChange, etc.)
    const handleListChange = (taskId: string, listId: string) => updateTask(taskId, { listId });
    const handleDateChange = (taskId: string, newDate: Date | undefined) => updateTask(taskId, { dueDate: newDate?.toISOString() ?? null });
    const handlePriorityChange = (taskId: string, priority: AppTask["priority"]) => updateTask(taskId, { priority });
    const handleAssigneeChange = (taskId: string, assigneeIds: string[]) => updateTask(taskId, { assigneeIds });
    const handleTitleChange = (taskId: string, columnId: "title", value: string) => updateTask(taskId, { title: value });
    const handleDescriptionChange = (taskId: string, description: string) => updateTask(taskId, { description });
    const handleLabelsChange = (taskId: string, labelIds: string[]) => updateTask(taskId, { labelIds });

    // --- RENDER LOGIC ---

    if (isLoading) {
        return <div className="p-4">Loading tasks...</div>; // Có thể thay bằng Skeleton UI
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
                    `,
                }}
            />
            
            {/* View Switcher luôn hiển thị để user có thể tương tác (tạo task mới, đổi view) */}
            <ViewSwitcher
                onViewModeChange={(viewMode) => setView(viewMode)}
                onViewListChange={setIsChecked}
                isChecked={isChecked}
                currentViewMode={view}
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
            />

            {/* LOGIC FIX: Chỉ hiển thị Gantt nếu có tasks */}
            <div className="flex-1 overflow-hidden">
                {tasks.length > 0 ? (
                    <Gantt
                        tasks={tasks}
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
                        <p className="text-sm">Create a new task to view the Gantt chart.</p>
                    </div>
                )}
            </div>

            {selectedTask && (
                <TaskDetailModal
                    task={selectedTask}
                    open={isModalOpen}
                    onOpenChange={handleModalClose}
                    users={members?.map(m => m.user) || []}
                    lists={lists}
                    onListChange={handleListChange}
                    onDateChange={handleDateChange}
                    onPriorityChange={handlePriorityChange}
                    onAssigneeChange={handleAssigneeChange}
                    onTitleChange={handleTitleChange}
                    onDescriptionChange={handleDescriptionChange}
                    onLabelsChange={handleLabelsChange}
                />
            )}
        </div>
    );
};

export default GanttPage;