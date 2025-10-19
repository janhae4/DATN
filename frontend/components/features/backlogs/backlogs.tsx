import { TaskDataTable } from "@/components/task/TaskDataTable";

export default function Backlogs() {
    return (
        <div className="flex flex-col gap-2 py-4">
            <h1 className="text-2xl font-bold">Backlogs</h1>
            <TaskDataTable/>
        </div>
    )
}
