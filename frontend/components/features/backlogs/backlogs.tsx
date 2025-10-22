import { EpicDataTable } from "@/components/epic/EpicDataTable";
import { TaskDataTable } from "@/components/task/TaskDataTable";

export default function Backlogs() {
    return (
        <div className="flex flex-col gap-8 py-4">

            <EpicDataTable />

            <TaskDataTable />

        </div>
    )
}
