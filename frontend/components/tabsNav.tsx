import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import Summary from "./features/summary/summary"
import Backlogs from "./features/backlogs/backlogs"
import TimelineView from "./features/timeline/TimelineView"
import { KanbanBoard } from "./features/boards/KanbanBoard"
export function TabsNav() {
    return (
        <div className="flex w-full h-full flex-col gap-6 overflow-hidden">
            <Tabs defaultValue="backlogs" className="h-full flex flex-col">
                <TabsList>
                    <TabsTrigger value="backlogs">Backlogs</TabsTrigger>
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="boards">Boards</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                </TabsList>
                <TabsContent value="backlogs" className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-secondary scrollbar-track-transparent">
                    <Backlogs />
                </TabsContent>
                <TabsContent value="summary" className="flex-1 overflow-hidden">
                    <Summary />
                </TabsContent>
                <TabsContent value="boards" className="flex-1 overflow-hidden">
                    <KanbanBoard />
                </TabsContent>
                <TabsContent value="timeline" className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-secondary scrollbar-track-transparent">
                    <TimelineView />
                </TabsContent>
            </Tabs>
        </div>
    )
}
