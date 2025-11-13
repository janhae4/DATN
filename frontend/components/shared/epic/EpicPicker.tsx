"use client"

import * as React from "react"
import { Epic } from "@/types/epic.type"
import { db } from "@/public/mock-data/mock-data"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Check, Plus, Edit, Search, Target } from "lucide-react" // Giữ nguyên Target
import { EpicCreateDialog } from "./EpicCreateDialog"
import { EpicEditDialog } from "./EpicEditDialog"
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface EpicPickerProps {
    value: string | null
    onChange: (epicId: string | null) => void
    disabled?: boolean
}

export function EpicPicker({ value, onChange, disabled }: EpicPickerProps) {
    const [open, setOpen] = React.useState(false)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [localEpics, setLocalEpics] = React.useState<Epic[]>(db.epics)
    const [refreshKey, setRefreshKey] = React.useState(0)

    const handleSave = () => {
        setLocalEpics([...db.epics])
        setRefreshKey((k) => k + 1)
    }

    const filteredEpics = React.useMemo(() => {
        return localEpics.filter((e) =>
            e.title.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [localEpics, searchTerm])

    const selectedEpic = localEpics.find((e) => e.id === value)

    const renderEpicItem = (epic: Epic) => (
        <button
            key={epic.id}
            type="button"
            className={cn(
                "w-full flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-muted text-left",
                value === epic.id ? "bg-primary/5" : ""
            )}
            onClick={() => {
                console.log('Epic selected:', { epicId: epic.id, epicTitle: epic.title })
                onChange(epic.id)
                setOpen(false)
            }}
        >
            <div className="flex items-center gap-2 truncate">
                <Target className="h-4 w-4 text-[#E06B80]" />
                <span className="truncate">{epic.title}</span>
            </div>
            {value === epic.id && <Check className="h-4 w-4 text-primary" />}
        </button>
    )

    const renderSelected = () => {
        if (!selectedEpic) {
            return (
                <div
                    className="w-full justify-between items-center gap-1 bg-white transition text-left px-2 rounded flex border  hover:text-black text-foreground/50  py-0.5 font-medium"
                >
                    <Plus className="h-3 w-3" /> <span className=""> Epic</span>
                </div>
            )
        }
        return (

            <div className="flex items-center px-2 py-0.5 border rounded text-[#450693] bg-[#450693]/10 font-medium uppercase">
                <span className="truncate max-w-[150px] text-xs">
                    {selectedEpic.title.length > 20
                        ? `${selectedEpic.title.substring(0, 20)}...`
                        : selectedEpic.title}
                </span>
            </div>

        )
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>

                {renderSelected()}
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0">
                <div className="flex flex-col" key={refreshKey}>
                    <div className="p-2">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search epics..."
                                className="pl-8 h-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    {/* Epic List (giữ nguyên) */}
                    <div className="max-h-[200px] overflow-y-auto py-1">
                        <button
                            type="button"
                            className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-muted"
                            onClick={() => {
                                onChange(null)
                                setOpen(false)
                            }}
                        >
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Target className="h-4 w-4" />
                                <span>No epic</span>
                            </div>
                            {value === null && <Check className="h-4 w-4 text-primary" />}
                        </button>

                        {filteredEpics.map(renderEpicItem)}
                    </div>

                    <Separator />
                    <div className="p-2 space-y-1">
                        <EpicCreateDialog onSave={handleSave}>
                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full justify-start h-8 px-2"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Create epic
                            </Button>
                        </EpicCreateDialog>

                        <EpicEditDialog
                            key={refreshKey}
                            onSave={handleSave}
                            allEpics={localEpics}
                        >
                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full justify-start h-8 px-2"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit epics
                            </Button>
                        </EpicEditDialog>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}