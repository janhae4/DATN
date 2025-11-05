import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import Summary from "./features/summary/summary"
import Backlogs from "./features/backlogs/backlogs"
import { KanbanBoard } from "./features/boards/KanbanBoard"
import TimelineView from "./features/timeline/TimelineView"
export function TabsNav() {
    return (
        <div className="flex w-full  flex-col gap-6">
            <Tabs defaultValue="backlogs">
                <TabsList>
                    <TabsTrigger value="backlogs">Backlogs</TabsTrigger>
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="boards">Boards</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                </TabsList>
                <TabsContent value="backlogs">
                    <Backlogs />
                </TabsContent>
                <TabsContent value="summary">
                    <Summary />
                </TabsContent>
                <TabsContent value="boards">
                    <KanbanBoard />
                </TabsContent>
                <TabsContent value="timeline">
                    <TimelineView />
                </TabsContent>
            </Tabs>
        </div>
    )
}
