import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import Summary from "./features/summary/summary"
import Backlogs from "./features/backlogs/backlogs"
export function TabsNav() {
    return (
        <div className="flex w-full  flex-col gap-6">
            <Tabs defaultValue="backlogs">
                <TabsList>
                    <TabsTrigger value="backlogs">Backlogs</TabsTrigger>
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="boards">Boards</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    <TabsTrigger value="pages">Pages</TabsTrigger>
                </TabsList>
                <TabsContent value="backlogs">
                    <Backlogs/>
                </TabsContent>
                <TabsContent value="summary">
                    <Summary/>
                </TabsContent>
                <TabsContent value="boards">
                    content
                </TabsContent>
                <TabsContent value="timeline">
                    content
                </TabsContent>
                <TabsContent value="pages">
                    content
                </TabsContent>
            </Tabs>
        </div>
    )
}
