import { TabsNav } from "@/components/tabsNav"
import { TaskManagementProvider } from "@/components/providers/TaskManagementContext"

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function Page({ searchParams }: { searchParams: { projectId?: string } }) {
  const projectId = searchParams.projectId || "project-phoenix-1";
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 h-full w-full overflow-hidden">
      <TaskManagementProvider projectId={projectId}>
        <TabsNav />
      </TaskManagementProvider>
    </div>
  )
}
