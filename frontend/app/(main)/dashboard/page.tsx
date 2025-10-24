import { TabsNav } from "@/components/tabsNav"
import { TaskManagementProvider } from "@/components/providers/TaskManagementContext"

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function Page() {
  return (
    <SidebarProvider>
      <SidebarInset>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <TaskManagementProvider>
            <TabsNav />
          </TaskManagementProvider>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
