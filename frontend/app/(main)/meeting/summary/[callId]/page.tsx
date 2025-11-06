// components/features/meeting/MeetingSummaryPage.tsx
"use client"

import * as React from "react"
import {
    Clock3,
    Calendar,
    User,
    ListChecks,
    Target,
    Users,
    ChevronLeft,
    FileText,
} from "lucide-react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation" 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"


// --- MOCK DATA TỔNG HỢP ---

interface Participant { userId: string; name: string; avatarFallback: string }

interface CallSummary {
    id: string
    roomId: string
    title: string
    createdAt: Date
    endedAt: Date
    participants: Participant[]
    keyDecisions: string[]
    actionItems: { id: number; description: string; assignedTo: string }[]
    transcriptSnippet: string
}

const mockSummaries: CallSummary[] = [
    {
        id: "call-1",
        roomId: "ROOM-ABC-123",
        title: "Project Alpha Kickoff",
        createdAt: new Date("2025-10-18T10:00:00Z"),
        endedAt: new Date("2025-10-18T10:35:30Z"),
        participants: [
            { userId: "u1", name: "You", avatarFallback: "A" },
            { userId: "u2", name: "Jane Doe", avatarFallback: "JD" },
            { userId: "u3", name: "Alex Smith", avatarFallback: "AS" },
            { userId: "u6", name: "Maxine", avatarFallback: "MX" },
        ],
        keyDecisions: [
            "Finalized the 'Beta Launch' date for next month.",
            "Approved the new design proposal for the landing page.",
            "Allocated 5 additional engineering hours to fix P1 bugs."
        ],
        actionItems: [
            { id: 1, description: "Update landing page mockups", assignedTo: "Jane Doe" },
            { id: 2, description: "Send out team retrospective invite", assignedTo: "You" },
            { id: 3, description: "Review API documentation for V2", assignedTo: "Alex Smith" },
        ],
        transcriptSnippet: "Jane: ...so we should commit to the beta launch next month. Alex: I agree, provided we finalize the design by Friday. You: Let's do it. I'll take the action item to send the retrospective invite."
    },
]

// --- HELPER FUNCTIONS ---

const calculateDuration = (start: Date, end: Date) => {
    const diffInMs = end.getTime() - start.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const minutes = diffInMinutes % 60
    const hours = Math.floor(diffInMinutes / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
}

const formatDateTime = (date: Date) => {
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })
}

// --- MAIN COMPONENT ---

export default function MeetingSummaryPage({ callId = "call-1" }: { callId: string }) {
    const router = useRouter()
    const summary = mockSummaries.find(s => s.id === callId)

    if (!summary) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                <h1 className="text-2xl font-bold mb-4">404 - Summary Not Found</h1>
                <p>The meeting with ID "{callId}" could not be found.</p>
                <Button onClick={() => router.back()} className="mt-4">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back to History
                </Button>
            </div>
        )
    }

    const duration = calculateDuration(summary.createdAt, summary.endedAt)

    return (
        <div className="flex flex-col gap-6 py-4 px-6 max-w-4xl mx-auto">
            
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="flex flex-col">
                    <h1 className="text-3xl font-bold leading-tight">{summary.title}</h1>
                    <p className="text-sm text-muted-foreground">Room ID: {summary.roomId}</p>
                </div>
            </div>

            <Card className="shadow-lg">
                <CardContent className="grid md:grid-cols-3 gap-6 pt-6">
                    <div className="flex items-center gap-3">
                        <Calendar className="h-6 w-6 text-muted-foreground" />
                        <div>
                            <p className="text-sm font-medium">Date Started</p>
                            <p className="text-lg font-semibold">{formatDateTime(summary.createdAt)}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Clock3 className="h-6 w-6 text-muted-foreground" />
                        <div>
                            <p className="text-sm font-medium">Duration</p>
                            <p className="text-lg font-semibold">{duration}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Users className="h-6 w-6 text-muted-foreground" />
                        <div>
                            <p className="text-sm font-medium">Attendees</p>
                            <div className="flex -space-x-2">
                                {summary.participants.slice(0, 4).map(p => (
                                    <Avatar key={p.userId} className="h-8 w-8 border-2 border-background">
                                        <AvatarFallback className="text-xs bg-primary/20">{p.avatarFallback}</AvatarFallback>
                                    </Avatar>
                                ))}
                                {summary.participants.length > 4 && (
                                    <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                                        <span className="text-xs text-muted-foreground">+{summary.participants.length - 4}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Separator />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Target className="h-5 w-5 text-green-500" />
                        Key Decisions ({summary.keyDecisions.length})
                    </CardTitle>
                    <CardDescription>Main agreements reached during the call.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="list-disc space-y-2 pl-5 text-sm">
                        {summary.keyDecisions.map((decision, index) => (
                            <li key={index} className="font-medium text-foreground">
                                {decision}
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <ListChecks className="h-5 w-5 text-blue-500" />
                        Action Items ({summary.actionItems.length})
                    </CardTitle>
                    <CardDescription>Tasks assigned to participants.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80%]">Task</TableHead>
                                <TableHead className="text-right">Assigned To</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {summary.actionItems.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.description}</TableCell>
                                    <TableCell className="text-right text-sm text-muted-foreground">{item.assignedTo}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        Transcript Snippet
                    </CardTitle>
                    <CardDescription>A short excerpt from the meeting transcript.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm italic p-3 bg-muted/50 rounded-lg border">
                        "{summary.transcriptSnippet}"
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                        <a href="#" className="hover:underline text-primary">View Full Transcript...</a>
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}