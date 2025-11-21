// components/features/backlogs/SprintList.tsx
"use client"

import * as React from "react"
import { db } from "@/public/mock-data/mock-data"
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
import { Progress } from "@/components/ui/progress"
import { Rocket, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDate, statusesForProject1 } from "@/lib/backlog-utils"
import { useDroppable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import { useTaskManagementContext } from "@/components/providers/TaskManagementContext"
import { Separator } from "@/components/ui/separator"
import { TaskRowList } from "../task/TaskRowList"
import { AddNewTaskRow } from "../task/AddNewTaskRow"

export function SprintList() {
  const { data, handleRowClick } = useTaskManagementContext()
  const [addingNewRowToSprint, setAddingNewRowToSprint] = React.useState<string | null>(null)
  const statusesList = statusesForProject1 ?? []

  const activeSprints = React.useMemo(() =>
    db.sprints.filter(
      s => s.projectId === "project-1" && s.status !== "completed"
    ),
    []
  );

  return (
    <Accordion type="multiple" className="w-full flex flex-col gap-2">
      {activeSprints.map((sprint: Sprint, index: number) => {
        const isLast = index === activeSprints.length - 1

        const sprintTasks = (data as Task[]).filter((t) => t.sprintId === sprint.id)
        const completedTasks = sprintTasks.filter(t => statusesList.find((s:any) => s.id === t.listId)?.id === 'done').length;
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
              "flex flex-col border rounded-sm transition-all",
              "data-[state=open]:bg-muted/20",
              isOver && "bg-primary/20",
            )}
          >
            <AccordionItem
              value={sprint.id}
              className="border-0"
            >
            <AccordionTrigger
              className={cn(
                "hover:no-underline px-4 py-2  text-left hover:bg-muted/50 cursor-pointer",
              )}
              
            >
              <div className="flex w-full flex-col gap-2 ">
                <div className="flex w-full items-center justify-between gap-4">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Rocket className="h-5 w-5 text-blue-600 flex-shrink-0" /> {/* Icon màu xanh */}
                    <span className="text-base font-medium truncate" title={sprint.title}>
                      {sprint.title}
                    </span>
                 <p className="text-sm text-muted-foreground pr-8"> {/* Thêm padding phải */}
                   {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                 </p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-4">
                    <Badge
                      variant={
                        sprint.status === "active" ? "default" : 
                        sprint.status === "completed" ? "destructive" :
                        sprint.status === "planned" ? "default" :
                        sprint.status === "archived" ? "outline" :
                        "secondary"
                      }
                      className={cn(
                        "capitalize",
                        sprint.status === "planned" && "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200",
                        sprint.status === "archived" && "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200"
                      )}
                    >
                      {sprint.status}
                    </Badge>
                    <span className="text-sm font-normal text-muted-foreground">
                       {totalTasks} {totalTasks === 1 ? "task" : "tasks"}
                     </span>
                  </div>
                </div>

              

              </div>
            </AccordionTrigger>

            <AccordionContent className="border-t bg-background/50 p-0 data-[state=closed]:animate-none">
              <div className="p-2">
                {sprintTasks.length > 0 ? (
                  <Table>
                    <TaskRowList
                      tasks={sprintTasks}
                      lists={statusesList as any}
                      isDraggable={true}
                      onRowClick={handleRowClick}
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
                            <div className="flex items-center gap-1">
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
                ) : (
                  <div 
                    ref={setNodeRef}
                    className={cn(
                      "flex flex-col items-center justify-center border-2 border-dashed rounded-lg text-center p-4",
                      isOver ? "border-primary/20 bg-primary/10" : "border-muted-foreground/30"
                    )}
                  >
                    <Rocket className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">No tasks in this sprint yet</p>
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
      })}
    </Accordion>
  );
};