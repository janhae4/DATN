// components/features/backlogs/SprintList.tsx
"use client"

import * as React from "react"
import { Sprint } from "@/types"
import { Task } from "@/types"
import { Accordion } from "@/components/ui/accordion"
import { statusesForProject1 } from "@/lib/backlog-utils"
import { useTaskManagementContext } from "@/components/providers/TaskManagementContext"
import { SprintItem } from "./SprintItem"
import { SprintStatus } from "@/types/common/enums"

export function SprintList() {
  const { data, handleRowClick, sprints } = useTaskManagementContext()
  const [addingNewRowToSprint, setAddingNewRowToSprint] = React.useState<string | null>(null)
  const statusesList = statusesForProject1 ?? []

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
          statusesList={statusesList}
          handleRowClick={handleRowClick}
          addingNewRowToSprint={addingNewRowToSprint}
          setAddingNewRowToSprint={setAddingNewRowToSprint}
        />
      ))}
    </Accordion>
  );
};
