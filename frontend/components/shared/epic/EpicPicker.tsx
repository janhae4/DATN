"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Check, Plus, Edit, Search } from "lucide-react"
import { EpicCreateDialog } from "./EpicCreateDialog"
import { EpicEditDialog } from "./EpicEditDialog"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import { useEpics } from "@/hooks/useEpics"

interface EpicPickerProps {
  value?: string | null
  onChange: (epicId: string | null) => void
  disabled?: boolean
}

export function EpicPicker({ value, onChange, disabled }: EpicPickerProps) {
  const params = useParams()
  const projectId = params.projectId as string

  const { epics, isLoading } = useEpics(projectId)

  const [open, setOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")

  const filteredEpics = React.useMemo(() => {
    return (epics || []).filter((e) =>
      e.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [epics, searchTerm])

  // Safety check: Ensure epics exists before trying to find
  const selectedEpic = (epics || []).find((e) => e.id === value)

  const renderEpicItem = (epic: any) => (
    <button
      key={epic.id}
      type="button"
      className={cn(
        "w-full flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-muted text-left",
        value === epic.id ? "bg-primary/5" : ""
      )}
      onClick={() => {
        onChange(epic.id)
        setOpen(false)
      }}
    >
      <div className="flex items-center gap-2 truncate">
        <div
          className="h-4 w-4 rounded-sm flex-shrink-0"
          style={{ backgroundColor: epic.color || "#E06B80" }}
        />
        <span className="truncate">{epic.title}</span>
      </div>
      {value === epic.id && <Check className="h-4 w-4 text-primary" />}
    </button>
  )

  const renderSelected = () => {
    if (!selectedEpic) {
      return (
        <Button
          variant="outline"
          className="h-7 invisible group-hover:visible"
          onClick={() => !disabled && setOpen(true)}
        >
          <Plus className="h-3 w-3 mr-1" /> <span className="">Epic</span>
        </Button>
      )
    }
    return (
      <div
        className={cn(
          "flex items-center px-2 py-0.5 border rounded font-medium uppercase cursor-pointer",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none"
        )}
        style={{
          color: selectedEpic.color || "#450693",
          backgroundColor: selectedEpic.color
            ? `${selectedEpic.color}1A`
            : "#4506931A",
          borderColor: selectedEpic.color
            ? `${selectedEpic.color}33`
            : undefined,
        }}
        onClick={() => !disabled && setOpen(true)}
      >
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
      <PopoverTrigger asChild>{renderSelected()}</PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="flex flex-col">
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

          <div className="max-h-[200px] overflow-y-auto py-1">
            {/* NO EPIC OPTION */}
            <button
              type="button"
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-muted"
              onClick={() => {
                onChange(null) 
                setOpen(false)
              }}
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-4 w-4 rounded-sm border-2 border-muted-foreground/30" />
                <span>No epic</span>
              </div>
              {/* Check if value is falsy (null or undefined) */}
              {!value && <Check className="h-4 w-4 text-primary" />}
            </button>

            {isLoading ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                Loading...
              </div>
            ) : filteredEpics.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                No epics found
              </div>
            ) : (
              filteredEpics.map(renderEpicItem)
            )}
          </div>

          <Separator />
          <div className="p-2 space-y-1">
            <EpicCreateDialog projectId={projectId}>
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start h-8 px-2"
                onClick={(e) => e.stopPropagation()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create epic
              </Button>
            </EpicCreateDialog>

            <EpicEditDialog projectId={projectId} epics={epics}>
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