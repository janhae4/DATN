"use client";

import * as React from "react";
import { Sprint, Task } from "@/types";
import { AccordionContent, AccordionItem } from "@/components/ui/accordion";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Table, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Rocket, PlusIcon, ChevronDown } from "lucide-react";
import { formatDate } from "@/lib/backlog-utils";
import { useDroppable, useDndContext } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { TaskRowList } from "../task/TaskRowList";
import { Button } from "@/components/ui/button";
import { AddNewTaskRow } from "../task/AddNewTaskRow";
import { StartSprintDialog } from "./StartSprintDialog";
import { CompleteSprintDialog } from "./CompleteSprintDialog";
import { SprintStatus } from "@/types/common/enums";

interface SprintItemProps {
  sprint: Sprint;
  tasks: Task[];
  statusesList: any[];
  handleRowClick: (task: Task) => void;
  selectedIds: string[];
  onSelect: (taskId: string, checked: boolean) => void;
  addingNewRowToSprint: string | null;
  setAddingNewRowToSprint: (id: string | null) => void;
  onUpdateTask: (taskId: string, updates: any) => void;
}

export function SprintItem({
  sprint,
  tasks,
  statusesList,
  handleRowClick,
  addingNewRowToSprint,
  setAddingNewRowToSprint,
  onUpdateTask,
  selectedIds,
  onSelect,
}: SprintItemProps) {
  const sprintTasks = tasks.filter((t) => t.sprintId === sprint.id);
  const totalTasks = sprintTasks.length;

  const { setNodeRef, isOver } = useDroppable({
    id: sprint.id,
    data: {
      type: "sprint-drop-area",
      sprint: sprint,
    },
  });

  // --- VISUAL FEEDBACK FIX ---
  // Check if we are dragging over this sprint OR any task inside this sprint
  const { over } = useDndContext();
  const isOverSprint = isOver; // Direct drop on sprint container
  const isOverTaskInSprint = over?.data?.current?.task?.sprintId === sprint.id;
  const shouldHighlight = isOverSprint || isOverTaskInSprint;

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

            <span className="text-sm font-normal text-muted-foreground">
              {totalTasks} {totalTasks === 1 ? "task" : "tasks"}
            </span>

            <AccordionPrimitive.Trigger className="[&[data-state=open]>svg]:rotate-180">
              <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 text-muted-foreground" />
            </AccordionPrimitive.Trigger>
          </div>
        </AccordionPrimitive.Header>

        <AccordionContent className="border-t bg-background/50 p-0 data-[state=closed]:animate-none">
          <div className="p-1">
            {sprintTasks.length > 0 ? (
              <>
                <Table>
                  <TaskRowList
                    onUpdateTask={onUpdateTask}
                    tasks={sprintTasks}
                    lists={statusesList}
                    isDraggable={true}
                    isSortable={true}
                    onRowClick={handleRowClick}
                    selectedIds={selectedIds}
                    onSelect={onSelect}
                  >
                    {addingNewRowToSprint === sprint.id ? (
                      <AddNewTaskRow
                        lists={statusesList}
                        sprintId={sprint.id}
                        onCancel={() => setAddingNewRowToSprint(null)}
                      />
                    ) : (
                      <TableRow className="group hover:bg-transparent">
                        <TableCell colSpan={5} className="p-0">
                          <div className="flex items-center gap-1 pl-10 py-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-3 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAddingNewRowToSprint(sprint.id);
                              }}
                            >
                              <PlusIcon className="mr-2 h-4 w-4" />
                              Create Task
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TaskRowList>
                </Table>
              </>
            ) : (
              <div
                className={cn(
                  "flex flex-col items-center justify-center border-2 border-dashed rounded-lg text-center p-4",
                  isOver
                    ? "border-primary/20 bg-primary/10"
                    : "border-muted-foreground/30"
                )}
              >
                <Rocket className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  No tasks in this sprint yet
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Drag tasks here or create a new one
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddingNewRowToSprint(sprint.id)}
                  className="gap-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  Create Task
                </Button>
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </div>
  );
}
