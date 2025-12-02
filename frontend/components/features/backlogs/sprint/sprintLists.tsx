// components/features/backlogs/SprintList.tsx
"use client"

import * as React from "react"
import { Sprint } from "@/types"
import { Task } from "@/types"
import { Accordion } from "@/components/ui/accordion"
import { useTaskManagementContext } from "@/components/providers/TaskManagementContext"
import { SprintItem } from "./SprintItem"
import { SprintStatus } from "@/types/common/enums"
import { useTasks } from "@/hooks/useTasks"
import { useParams } from "next/navigation"
import { useLists } from "@/hooks/useList"

export function SprintList() {
  const { data, handleRowClick, sprints } = useTaskManagementContext()
    const params = useParams();
    const projectId = params.projectId as string;

  const {updateTask} = useTasks(projectId)
  const [addingNewRowToSprint, setAddingNewRowToSprint] = React.useState<string | null>(null)
  const {lists} = useLists(projectId)

  const activeSprints = React.useMemo(() =>
    sprints.filter(
      s => s.status === SprintStatus.ACTIVE || s.status === SprintStatus.PLANNED
    ),
    [sprints]
  );

  return (
    <Accordion type="multiple" className="w-full flex flex-col gap-2">
      {activeSprints.map((sprint: Sprint) => (
        <SprintItem
          key={sprint.id}
          sprint={sprint}
          tasks={data as Task[]}
          statusesList={lists}
          handleRowClick={handleRowClick}
          addingNewRowToSprint={addingNewRowToSprint}
          setAddingNewRowToSprint={setAddingNewRowToSprint}
          onUpdateTask={updateTask}
        />
      ))}
    </Accordion>
  );
};
