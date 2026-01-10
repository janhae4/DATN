"use client"

import React, { useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { useEpics } from "@/hooks/useEpics"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Target, CalendarDays, MoreHorizontal } from "lucide-react"
import { EpicCreateDialog } from "./EpicCreateDialog"
import { EpicEditDialog } from "./EpicEditDialog"
import { EpicDetailDialog } from "./EpicDetailDialog"
import { Epic, EpicStatus } from "@/types"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { HelpTooltip } from "../HelpTooltip"

export function EpicList() {
    const params = useParams()
    const projectId = params.projectId as string
    const { epics, isLoading } = useEpics(projectId)
    const [selectedEpic, setSelectedEpic] = useState<Epic | null>(null)

    // Sort epics: In Progress -> Todo -> Done -> Canceled
    const sortedEpics = useMemo(() => {
        if (!epics) return []
        const statusOrder = {
            [EpicStatus.IN_PROGRESS]: 1,
            [EpicStatus.TODO]: 2,
            [EpicStatus.DONE]: 3,
            [EpicStatus.CANCELED]: 4,
        }
        return [...epics].sort((a, b) => {
            return (statusOrder[a.status as EpicStatus] || 99) - (statusOrder[b.status as EpicStatus] || 99)
        })
    }, [epics])

    if (isLoading) {
        return (
            <Card className="h-full border-none shadow-none bg-transparent">
                <CardHeader className="px-0 pt-0 pb-4">
                    <Skeleton className="h-8 w-32" />
                </CardHeader>
                <CardContent className="px-0 space-y-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-xl" />
                    ))}
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <Card className="py-2! border-none shadow-none h-full bg-transparent flex flex-col">
                <CardHeader className="px-0 pt-0 pb-4 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        Epics <HelpTooltip text="Epics are high-level project goals or deliverables. They group related tasks and provide a clear overview of project scope." />
                        <Badge variant="secondary" className="ml-2">
                            {epics?.length || 0}
                        </Badge>
                    </CardTitle>
                    <div className="flex gap-1">
                        <EpicCreateDialog projectId={projectId}>
                            <Button variant="outline" size="sm" className="h-8">
                                <Plus className="h-3.5 w-3.5 mr-1.5" />
                                New Epic
                            </Button>
                        </EpicCreateDialog>
                    </div>
                </CardHeader>

                <div className="flex-1 h-full overflow-y-auto ">
                    <div className="space-y-3 h-full pb-2">
                        {sortedEpics.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-xl border-muted-foreground/20">
                                <Target className="h-10 w-10 text-muted-foreground/30 mb-2" />
                                <p className="text-sm font-medium text-muted-foreground">No epics yet</p>
                                <p className="text-xs text-muted-foreground/70 mb-4">Create an epic to group your tasks</p>
                                <EpicCreateDialog projectId={projectId}>
                                    <Button size="sm">Create Epic</Button>
                                </EpicCreateDialog>
                            </div>
                        ) : (
                            sortedEpics.map((epic) => (
                                <div
                                    key={epic.id}
                                    onClick={() => setSelectedEpic(epic as any)}
                                    className="group relative flex flex-col gap-3 rounded-xl border bg-card p-4 text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-primary/50 cursor-pointer"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="h-2 w-2 rounded-full shrink-0"
                                                    style={{ backgroundColor: epic.color || "#888" }}
                                                />
                                                <h4 className="font-semibold leading-none tracking-tight">{epic.title}</h4>
                                            </div>
                                            {epic.description && (
                                                <p className="text-xs text-muted-foreground line-clamp-2 pl-4">
                                                    {epic.description}
                                                </p>
                                            )}
                                        </div>
                                        <Badge
                                            variant={epic.status === EpicStatus.DONE ? "secondary" : "default"}
                                            className={cn(
                                                "shrink-0 capitalize",
                                                epic.status === EpicStatus.TODO && "bg-slate-100 text-slate-600 hover:bg-slate-200",
                                                epic.status === EpicStatus.IN_PROGRESS && "bg-blue-100 text-blue-700 hover:bg-blue-200",
                                                epic.status === EpicStatus.DONE && "bg-green-100 text-green-700 hover:bg-green-200",
                                                epic.status === EpicStatus.CANCELED && "bg-red-50 text-red-600 hover:bg-red-100"
                                            )}
                                        >
                                            {epic.status.replace("_", " ")}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center justify-between pl-4 pt-1">
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            {epic.dueDate && (
                                                <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                                                    <CalendarDays className="h-3.5 w-3.5" />
                                                    <span>{format(new Date(epic.dueDate), "MMM d")}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1.5">
                                                <span className={cn(
                                                    "h-1.5 w-1.5 rounded-sm",
                                                    epic.priority === 'high' || epic.priority === 'urgent' ? 'bg-red-500' : 'bg-blue-400'
                                                )} />
                                                <span className="capitalize">{epic.priority}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </Card>

            <EpicDetailDialog
                epic={selectedEpic as any}
                open={!!selectedEpic}
                onOpenChange={(open) => !open && setSelectedEpic(null)}
            />
        </>
    )
}
