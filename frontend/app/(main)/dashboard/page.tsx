import { TabsNav } from "@/components/tabsNav"

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function Page() {
  return (
    <SidebarProvider>
      <SidebarInset>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <TabsNav />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
