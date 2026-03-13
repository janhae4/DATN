"use client";

import * as React from "react";
import { Sprint, Task } from "@/types";
import { AccordionContent, AccordionItem } from "@/components/ui/accordion";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Rocket, PlusIcon, ChevronDown, Trash2, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/backlog-utils";
import { useDroppable, useDndContext } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { TaskRowList } from "../task/TaskRowList";
import { Button } from "@/components/ui/button";
import { AddNewTaskRow } from "../task/AddNewTaskRow";
import { StartSprintDialog } from "./StartSprintDialog";
import { CompleteSprintDialog } from "./CompleteSprintDialog";
import { DeleteSprintDialog } from "./DeleteSprintDialog";
import { SprintStatus } from "@/types/common/enums";
import { useParams } from "next/navigation";
import { useSprints } from "@/hooks/useSprints";
import { useTasks } from "@/hooks/useTasks";
import { useInView } from "react-intersection-observer";

interface SprintItemProps {
  sprint: Sprint;
  // allTasks is still used for subtask resolution across sprint/backlog boundary
  allTasks: Task[];
  statusesList: any[];
  handleRowClick: (task: Task) => void;
  selectedIds: string[];
  onSelect: (taskId: string, checked: boolean) => void;
  onUpdateTask: (taskId: string, updates: any) => void;
  onMultiSelectChange: (ids: string[]) => void;
}

export function SprintItem({
  sprint,
  allTasks,
  statusesList,
  handleRowClick,
  onUpdateTask,
  selectedIds,
  onSelect,
  onMultiSelectChange,
}: SprintItemProps) {
  const params = useParams();
  const projectId = params.projectId as string;
  const teamId = params.teamId as string;
  const { deleteSprint } = useSprints(projectId, teamId);

  // Each SprintItem fetches its own tasks independently
  // This means task creation/invalidation directly updates this component
  const {
    tasks: fetchedTasks,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTasks({
    projectId,
    teamId,
    sprintId: [sprint.id],
    approvalStatus: "APPROVED",
    limit: 50,
  });

  // Merge self-fetched sprint tasks with allTasks for subtask resolution
  const sprintOwnTasks = React.useMemo(() => {
    const seen = new Set();
    return fetchedTasks.filter((t) => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
  }, [fetchedTasks]);

  // Combined allTasks: prefer sprint-fetched data, supplement with allTasks for subtasks
  const combinedAllTasks = React.useMemo(() => {
    const seen = new Set();
    const combined = [...sprintOwnTasks, ...allTasks];
    return combined.filter((t) => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
  }, [sprintOwnTasks, allTasks]);

  // Only root-level tasks shown as rows; subtasks shown nested via combinedAllTasks
  const rootSprintTasks = sprintOwnTasks.filter((t) => !t.parentId);
  const totalTasks = rootSprintTasks.length;

  const [addingNewRowToSprint, setAddingNewRowToSprint] = React.useState<
    string | null
  >(null);

  const { setNodeRef, isOver } = useDroppable({
    id: sprint.id,
    data: {
      type: "sprint-drop-area",
      sprint: sprint,
    },
  });

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "200px",
  });

  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && fetchNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const { over } = useDndContext();
  const isOverSprint = isOver;
  const isOverTaskInSprint = over?.data?.current?.task?.sprintId === sprint.id;
  const shouldHighlight = isOverSprint || isOverTaskInSprint;
  const shouldShowTaskList =
    rootSprintTasks.length > 0 || addingNewRowToSprint === sprint.id;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-lg border bg-card transition-all duration-300 ease-in-out",
        shouldHighlight
          ? "border-primary ring-4 ring-primary/10 shadow-xl bg-primary/5 z-10"
          : "hover:border-primary/50 hover:shadow-sm"
      )}
    >
      <AccordionItem value={sprint.id} className="border-0">
        <AccordionPrimitive.Header className="flex items-center justify-between px-4 py-2 hover:bg-muted/50 transition-colors">
          <AccordionPrimitive.Trigger
            className={cn(
              "flex flex-1 items-center gap-2 text-left cursor-pointer hover:no-underline group [&[data-state=open]>svg]:rotate-180"
            )}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Rocket className="h-5 w-5 text-foreground/50 flex-shrink-0" />
              <span
                className="text-base font-medium truncate"
                title={sprint.title}
              >
                {sprint.title}
              </span>
              <p className="text-sm text-muted-foreground">
                {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
              </p>
            </div>
          </AccordionPrimitive.Trigger>

          <div className="flex items-center gap-4">
            {sprint.status === SprintStatus.PLANNED && totalTasks > 0 && (
              <StartSprintDialog sprint={sprint}>
                <Button size="sm" variant="outline">
                  Start Sprint
                </Button>
              </StartSprintDialog>
            )}
            {sprint.status === SprintStatus.ACTIVE && (
              <CompleteSprintDialog sprint={sprint}>
                <Button size="sm" variant="outline">
                  Complete Sprint
                </Button>
              </CompleteSprintDialog>
            )}

            <DeleteSprintDialog sprint={sprint}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </DeleteSprintDialog>

            <span className="text-sm font-normal text-muted-foreground">
              {totalTasks} {totalTasks === 1 ? "task" : "tasks"}
            </span>

            <AccordionPrimitive.Trigger className="[&[data-state=open]>svg]:rotate-180">
              <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 text-muted-foreground" />
            </AccordionPrimitive.Trigger>
          </div>
        </AccordionPrimitive.Header>

        <AccordionContent className="border-t bg-background/50 p-0 data-[state=closed]:animate-none flex flex-col max-h-[calc(60vh-9rem)]">
          <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
            {rootSprintTasks.length > 0 || isFetchingNextPage ? (
              <Table>
                <TaskRowList
                  onUpdateTask={onUpdateTask}
                  allTasks={combinedAllTasks}
                  tasks={rootSprintTasks}
                  lists={statusesList}
                  isDraggable={true}
                  isSortable={true}
                  onRowClick={handleRowClick}
                  selectedIds={selectedIds}
                  onSelect={onSelect}
                  onMultiSelectChange={onMultiSelectChange}
                >
                  <TableRow className="hover:bg-transparent border-none">
                    <TableCell colSpan={5} className="p-0 border-none">
                      <div ref={ref} className="h-4 w-full" />
                      {isFetchingNextPage && (
                        <div className="flex justify-center p-4">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                </TaskRowList>
              </Table>
            ) : (
              <div
                className={cn(
                  "flex flex-col items-center justify-center h-32 m-4 border-2 border-dashed rounded-lg text-center",
                  isOver
                    ? "border-primary/20 bg-primary/10"
                    : "border-muted-foreground/30"
                )}
              >
                <Rocket className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  No tasks in this sprint yet
                </p>
                <p className="text-xs text-muted-foreground">
                  Drag tasks here or create a new one below
                </p>
              </div>
            )}
          </div>

          <div className="shrink-0 z-10 bg-card rounded-lg sticky bottom-2 border-t shadow-sm">
            {addingNewRowToSprint === sprint.id ? (
              <Table>
                <TableBody>
                  <AddNewTaskRow
                    lists={statusesList}
                    sprintId={sprint.id}
                    onCancel={() => setAddingNewRowToSprint(null)}
                  />
                </TableBody>
              </Table>
            ) : (
              <div className="flex items-center gap-4 p-2">
                <Button
                  variant="ghost"
                  className="flex items-center gap-4 p-2 text-zinc-500 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/50 dark:hover:bg-zinc-900 cursor-pointer w-full justify-start rounded-lg transition-colors border border-dashed border-zinc-200 dark:border-zinc-800"
                  onClick={() => setAddingNewRowToSprint(sprint.id)}
                >
                  <PlusIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">Create Task</span>
                </Button>
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </div>
  );
}
