"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import {
    Clock3,
} from "lucide-react"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Avatar,
    AvatarFallback,
} from "@/components/ui/avatar"

interface Call {
    id: string
    roomId: string
    createdAt: Date
    endedAt: Date
    participants: { userId: string; name: string; avatarFallback: string }[]
}

const mockCalls: Call[] = [
    {
        id: "call-1",
        roomId: "ROOM-ABC-123",
        createdAt: new Date("2025-10-18T10:00:00Z"),
        endedAt: new Date("2025-10-18T10:35:30Z"),
        participants: [
            { userId: "u1", name: "You", avatarFallback: "A" },
            { userId: "u2", name: "Jane Doe", avatarFallback: "JD" },
            { userId: "u3", name: "Alex Smith", avatarFallback: "AS" },
            { userId: "u6", name: "Maxine", avatarFallback: "MX" },
        ],
    },
    {
        id: "call-2",
        roomId: "ROOM-XYZ-456",
        createdAt: new Date("2025-10-17T15:30:00Z"),
        endedAt: new Date("2025-10-17T16:00:00Z"),
        participants: [
            { userId: "u1", name: "You", avatarFallback: "A" },
            { userId: "u4", name: "Boss", avatarFallback: "B" },
        ],
    },
    {
        id: "call-3",
        roomId: "ROOM-DEF-789",
        createdAt: new Date("2025-10-16T09:00:00Z"),
        endedAt: new Date("2025-10-16T09:05:00Z"),
        participants: [
            { userId: "u5", name: "Dev Team", avatarFallback: "DT" },
        ],
    },
]

const calculateDuration = (start: Date, end: Date) => {
    const diffInMs = end.getTime() - start.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const minutes = diffInMinutes % 60
    const hours = Math.floor(diffInMinutes / 60)

    if (hours > 0) {
        return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
}

const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    })
}

export function MeetingHistory() {
    const router = useRouter()

    const handleRowClick = (callId: string) => {
        router.push(`/meeting/summary/${callId}`)
    }

    return (
        <div className="rounded-xl border p-4">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[180px] text-xs font-semibold uppercase text-muted-foreground/80">Date</TableHead>
                        <TableHead className="text-xs font-semibold uppercase text-muted-foreground/80">Room ID</TableHead>
                        <TableHead className="text-center w-[120px] text-xs font-semibold uppercase text-muted-foreground/80">Duration</TableHead>
                        <TableHead className="text-left text-xs font-semibold uppercase text-muted-foreground/80">Participants</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {mockCalls.map((call) => (
                        <TableRow
                            key={call.id}
                            className="cursor-pointer hover:bg-muted/70 transition-colors"
                            onClick={() => handleRowClick(call.id)}
                        >
                            <TableCell className="font-medium">
                                <div className="flex flex-col">
                                    <span>{formatDate(call.createdAt)}</span>
                                    <span className="text-muted-foreground text-xs leading-none">
                                        {call.createdAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                                        {" - "}
                                        {call.endedAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                </div>
                            </TableCell>

                            <TableCell className="text-sm font-medium">
                                {call.roomId}
                            </TableCell>

                            <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1 font-medium">
                                    <Clock3 className="h-4 w-4 text-muted-foreground" />
                                    {calculateDuration(call.createdAt, call.endedAt)}
                                </div>
                            </TableCell>

                            <TableCell>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center -space-x-2">
                                        {call.participants.slice(0, 3).map((participant) => (
                                            <Avatar key={participant.userId} className="h-8 w-8 border-2 border-background">
                                                <AvatarFallback className="text-xs bg-muted/80 font-medium">
                                                    {participant.avatarFallback}
                                                </AvatarFallback>
                                            </Avatar>
                                        ))}
                                        {call.participants.length > 3 && (
                                            <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                                                <span className="text-xs font-semibold text-muted-foreground/80">
                                                    +{call.participants.length - 3}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-sm font-medium text-foreground whitespace-nowrap">
                                        {call.participants.length} participants
                                    </div>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}