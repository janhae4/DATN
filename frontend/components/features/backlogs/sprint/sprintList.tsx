"use client"

import * as React from "react"
import { Sprint } from "@/types"
import { Task } from "@/types"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Table, TableRow, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Rocket, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDate, statusesForProject1 } from "@/lib/backlog-utils"
import { useDroppable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import { useTaskManagementContext } from "@/components/providers/TaskManagementContext"
import { TaskRowList } from "../task/TaskRowList"
import { AddNewTaskRow } from "../task/AddNewTaskRow"
import { SprintStatus } from "@/types/common/enums"
import { useLists } from "@/hooks/useList"
import { useParams } from "next/navigation"
import { useTasks } from "@/hooks/useTasks"

export function SprintList() {
  // Lấy sprints từ Context (Dữ liệu thật từ useSprints)
  const { data, handleRowClick, sprints } = useTaskManagementContext()

  const params = useParams();
  const projectId = params.projectId as string;

  const { updateTask } = useTasks(projectId)
  const { lists } = useLists(projectId)
  const [addingNewRowToSprint, setAddingNewRowToSprint] = React.useState<string | null>(null)
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const handleSelectTask = (taskId: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, taskId] : prev.filter((id) => id !== taskId)
    );
  };

  // Filter Active & Planned sprints
  const activeSprints = React.useMemo(() =>
    sprints.filter(
      s => s.status !== SprintStatus.COMPLETED && s.status !== SprintStatus.ARCHIVED
    ),
    [sprints]
  );

  return (
    <Accordion type="multiple" className="w-full flex flex-col gap-2">
      {activeSprints.map((sprint: Sprint) => {
        const sprintTasks = (data as Task[]).filter((t) => t.sprintId === sprint.id)
        const totalTasks = sprintTasks.length;

        const { setNodeRef, isOver } = useDroppable({
          id: sprint.id,
          data: {
            type: "sprint-drop-area",
            sprint: sprint,
          },
        });

        return (
          <div
            key={sprint.id}
            ref={setNodeRef}
            className={cn(
              "flex flex-col border rounded-sm transition-all bg-card",
              isOver && "bg-primary/5 border-primary/50",
            )}
          >
            <AccordionItem value={sprint.id} className="border-0">
              <AccordionTrigger className="hover:no-underline px-4 py-2 hover:bg-muted/50 cursor-pointer">
                <div className="flex w-full items-center justify-between gap-4">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Rocket className="h-4 w-4 text-muted-foreground" />
                    <span className="text-base font-medium truncate" title={sprint.title}>
                      {sprint.title}
                    </span>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={sprint.status === SprintStatus.ACTIVE ? "default" : "secondary"}>
                      {sprint.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {totalTasks} tasks
                    </span>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="border-t bg-background/50 p-0">
                <div className="p-2">
                  {sprintTasks.length > 0 ? (
                    <Table>
                      <TaskRowList
                        selectedIds={selectedIds}
                        onSelect={handleSelectTask}
                        tasks={sprintTasks}
                        lists={lists}
                        isDraggable={true}
                        onRowClick={handleRowClick}
                        onUpdateTask={updateTask}
                      >
                        {addingNewRowToSprint === sprint.id ? (
                          <AddNewTaskRow
                            lists={lists}
                            sprintId={sprint.id}
                            onCancel={() => setAddingNewRowToSprint(null)}
                          />
                        ) : (
                          <TableRow className="group hover:bg-transparent">
                            <TableCell colSpan={5} className="p-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 p-0 text-muted-foreground ml-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAddingNewRowToSprint(sprint.id);
                                }}
                              >
                                <PlusIcon className="m-0 h-4 w-4" />
                                Create Task
                              </Button>
                            </TableCell>
                          </TableRow>
                        )}
                      </TaskRowList>
                    </Table>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                      No tasks yet. Drag tasks here or create one.
                      <div className="mt-2">
                        <Button variant="outline" size="sm" onClick={() => setAddingNewRowToSprint(sprint.id)}>
                          Create Task
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </div>
        );
      })}
    </Accordion>
  );
};