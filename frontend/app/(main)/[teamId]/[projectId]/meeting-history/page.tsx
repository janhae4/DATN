// components/features/meeting/MeetingPage.tsx
"use client"

import * as React from "react"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { MeetingHistory } from "@/components/features/meeting/MeetingHistory"

function MeetingPage({ initialTab = "history" }: { initialTab?: "join" | "history" }) {

    const [activeTab, setActiveTab] = React.useState(initialTab);

    return (
        <div className="flex w-full flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold">Meeting History</h1>
                <p className="text-muted-foreground">Review past video and voice call sessions.</p></div>
            <MeetingHistory />
        </div>
    )
}

export default MeetingPage