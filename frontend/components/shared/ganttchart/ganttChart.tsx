import React, { useState } from "react";
import { Task, ViewMode, Gantt } from "gantt-task-react";
import { getStartEndDateForProject, initTasks, mapProjectTasksToGanttTasks } from "./helper";
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

// Init
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

    const ganttTasks = React.useMemo(
        () => mapProjectTasksToGanttTasks(projectTasks),
        [projectTasks]
    );

    const [tasks, setTasks] = React.useState<Task[]>(ganttTasks);
    const [isChecked, setIsChecked] = React.useState(true);

    // Sync local tasks when server data changes
    React.useEffect(() => {
        setTasks(ganttTasks);
    }, [ganttTasks]);

    let columnWidth = 65;
    if (view === ViewMode.Year) {
        columnWidth = 350;
    } else if (view === ViewMode.Month) {
        columnWidth = 300;
    } else if (view === ViewMode.Week) {
        columnWidth = 250;
    }

    const handleTaskChange = async (task: Task) => {
        console.log("On date change Id:" + task.id);
        
        // Optimistic update locally for smoothness
        let newTasks = tasks.map((t) => (t.id === task.id ? task : t));
        
        // Logic to update parent Project task (if exists)
        if (task.project) {
            // Check if the "project" exists as a task in our list
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
            // Revert on error would be ideal, but rely on React Query refetch for now
        }
    };

    const handleTaskDelete = (task: Task) => {
        const conf = window.confirm("Are you sure about " + task.name + " ?");
        if (conf) {
            // Optimistic delete
            setTasks(tasks.filter((t) => t.id !== task.id));
            
            // API call
            deleteTask(task.id)
                .then(() => {
                    toast.success("Task deleted");
                })
                .catch((err) => {
                    console.error(err);
                    toast.error("Failed to delete task");
                });
        }
        return conf;
    };


    const handleDblClick = (task: Task) => {
        // Find the original AppTask
        const originalTask = projectTasks.find(t => t.id === task.id);
        if (originalTask) {
            setSelectedTask(originalTask);
            setIsModalOpen(true);
        }
    };

    const handleClick = (task: Task) => {
        // Optional: Single click could also select, but sticking to dblClick for modal opening is standard in Gantt
        // console.log("On Click event Id:" + task.id);
    };

    const handleSelect = (task: Task, isSelected: boolean) => {
        // console.log(task.name + " has " + (isSelected ? "selected" : "unselected"));
    };

    const handleExpanderClick = (task: Task) => {
        setTasks(tasks.map((t) => (t.id === task.id ? task : t)));
        console.log("On expander click Id:" + task.id);
    };

    // Modal Handlers
    const handleModalClose = (open: boolean) => {
        setIsModalOpen(open);
        if (!open) setSelectedTask(null);
    };

    const handleListChange = (taskId: string, listId: string) => {
        updateTask(taskId, { listId });
    };

    const handleDateChange = (taskId: string, newDate: Date | undefined) => {
        updateTask(taskId, { dueDate: newDate?.toISOString() ?? null });
    };

    const handlePriorityChange = (taskId: string, priority: AppTask["priority"]) => {
        updateTask(taskId, { priority });
    };

    const handleAssigneeChange = (taskId: string, assigneeIds: string[]) => {
        updateTask(taskId, { assigneeIds });
    };

    const handleTitleChange = (taskId: string, columnId: "title", value: string) => {
        updateTask(taskId, { title: value });
    };

    const handleDescriptionChange = (taskId: string, description: string) => {
        updateTask(taskId, { description });
    };
    
    const handleLabelsChange = (taskId: string, labelIds: string[]) => {
        updateTask(taskId, { labelIds });
    }

    return (
        <div
            className="Wrapper"
        >
             <style
                dangerouslySetInnerHTML={{
                    __html: `
                        ._3_ygE{
                        border-top-left-radius: 10px;
                        }

                        ._CZjuD{
                        border-radius: 10px;
                        }

                        ._1nBOt{
                        display: flex; 
                        align-items: center;
                        justify-content: center;
                        flex-direction: row;
                        }
                        ._1nBOt > *{
                            display: flex; 
                            font-weight: bold;
                            align-items: center;
                            justify-content: center;
                            flex-direction: row;
                        }
                    `,
                }}
            />
            <ViewSwitcher
                onViewModeChange={(viewMode) => setView(viewMode)}
                onViewListChange={setIsChecked}
                isChecked={isChecked}
                currentViewMode={view}
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
            />
            <Gantt
                tasks={tasks}
                viewMode={view}
                onDateChange={handleTaskChange}
                onDelete={handleTaskDelete}
                onDoubleClick={handleDblClick}
                onClick={handleClick}
                onSelect={handleSelect}
                onExpanderClick={handleExpanderClick}

                // Layout
                listCellWidth={isChecked ? "155px" : ""}
                columnWidth={columnWidth}
                rowHeight={50} // Chiều cao mỗi dòng

                // Styling (Sửa lỗi tại đây)
                barFill={65} // Bar dày 65% dòng
                barCornerRadius={4} // Bo tròn góc
                barProgressColor="#3b82f6" // Blue-500
                barProgressSelectedColor="#1d4ed8" // Blue-700
                barBackgroundColor="black" // Slate-200
                projectProgressColor="#10b981" // Green-500 (Cho Project cha)
                projectBackgroundColor="#d1fae5" // Green-100

                // Typography
                fontFamily="roboto"
                fontSize="12px"
            />

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