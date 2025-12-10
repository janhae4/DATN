"use client"

import * as React from "react"
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

function getTabFromHash(): string {
    if (typeof window === "undefined") return "backlogs"
    const hash = window.location.hash.replace("#", "")
    if (["backlogs", "summary", "boards", "timeline"].includes(hash)) {
        return hash
    }
    return "backlogs"
}

export function TabsNav() {
    const [activeTab, setActiveTab] = React.useState<string>("backlogs")

    React.useEffect(() => {
        // Set initial tab from hash on mount
        setActiveTab(getTabFromHash())

        const handleHashChange = () => {
            setActiveTab(getTabFromHash())
        }

        window.addEventListener("hashchange", handleHashChange)
        return () => window.removeEventListener("hashchange", handleHashChange)
    }, [])

    const handleTabChange = (value: string) => {
        setActiveTab(value)
        if (typeof window !== "undefined") {
            const url = new URL(window.location.href)
            url.hash = value
            window.history.replaceState(null, "", url.toString())
        }
    }

    return (
        <div className="flex w-full h-full flex-col gap-6 overflow-hidden">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col w-full">
                <TabsList>
                    <TabsTrigger value="backlogs">Backlogs</TabsTrigger>
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="boards">Boards</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                </TabsList>
                <TabsContent value="backlogs" className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-secondary scrollbar-track-transparent">
                    <Backlogs />
                </TabsContent>
                <TabsContent value="summary" className="flex-1 overflow-y-auto">
                    <Summary />
                </TabsContent>
                <TabsContent value="boards" className="flex-1 overflow-hidden min-w-0">
                    <KanbanBoard />
                </TabsContent>
                <TabsContent value="timeline" className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-secondary scrollbar-track-transparent">
                    <TimelineView />
                </TabsContent>
            </Tabs>
        </div>
    )
}
