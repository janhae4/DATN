"use client"

import * as React from "react"
// BỎ IMPORT CÁC COMPONENT DIALOG Ở ĐÂY
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// ...
import { Status, statusEnum } from "@/types/status.interface"
import { db } from "@/public/mock-data/mock-data"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import { Check, Plus, Edit } from "lucide-react" // THÊM ICON
import { Separator } from "@/components/ui/separator" // THÊM SEPARATOR

// BỎ IMPORT STATUSSETTINGPOPOVER
// import { StatusSettingsPopover } from "./StatusSettingsPopover"

// IMPORT 2 DIALOG MỚI
import { StatusCreateDialog } from "./StatusCreateDialog"
import { StatusEditDialog } from "./StatusEditDialog"

// Map này để render cái <Select> cho đẹp
const categoryMap = {
  [statusEnum.todo]: "To do",
  [statusEnum.in_progress]: "In progress",
  [statusEnum.done]: "Done",
}

type StatusPickerProps = {
  statuses: Status[]
  value?: string | null
  onChange: (statusId: string) => void
  disabled?: boolean
}

export function StatusPicker({
  statuses: initialStatuses,
  value,
  onChange,
  disabled,
}: StatusPickerProps) {
  const [statuses, setStatuses] = React.useState<Status[]>(initialStatuses)

  React.useEffect(() => {
    setStatuses(initialStatuses)
  }, [initialStatuses])

  const grouped = React.useMemo(() => {
    return {
      todo: statuses.filter((s) => s.status === statusEnum.todo),
      in_progress: statuses.filter(
        (s) => s.status === statusEnum.in_progress
      ),
      done: statuses.filter((s) => s.status === statusEnum.done),
    }
  }, [statuses])

  const [open, setOpen] = React.useState(false)
  const [refreshKey, setRefreshKey] = React.useState(0)

  const handleSave = () => {
    setStatuses([...db.statuses])
    setRefreshKey((k) => k + 1)
  }

  const renderSection = (title: string, items: Status[]) => {
    if (!items || items.length === 0) return null
    return (
      <div className="py-1">
        <div className="px-3 py-1 text-xs font-semibold text-muted-foreground">
          {title}
        </div>
        <div className="space-y-1">
          {items.map((s) => (
            <button
              key={s.id}
              type="button"
              className={cn(
                "w-full flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-muted ",
                value === s.id ? "bg-primary/5" : ""
              )}
              onClick={() => {
                onChange(s.id)
                setOpen(false)
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span>{s.name}</span>
              </div>
              {value === s.id && <Check className="h-4 w-4 text-primary" />}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="h-7 px-2 flex items-center gap-2"
        >
          {(() => {
            const selected = statuses.find((s) => s.id === value)
            if (!selected) return <span>Status</span>
            return (
              <>
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: selected.color }}
                ></span>
                <span className="truncate">{selected.name}</span>
              </>
            )
          })()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0">
        {/* Thêm key refresh ở đây */}
        <div className="flex flex-col" key={refreshKey}>

          {renderSection("Not started", grouped.todo)}
          {renderSection("Active", grouped.in_progress)}
          {renderSection("Done", grouped.done)}

          <Separator />
          <div className="p-2">
            <StatusCreateDialog onSave={handleSave}>
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start h-8 px-2"
                onClick={(e) => e.stopPropagation()} // Prevent popover from closing
              >
                <Plus className="h-4 w-4 mr-2" />
                Create status
              </Button>
            </StatusCreateDialog>

            <StatusEditDialog key={refreshKey} onSave={handleSave}>
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start h-8 px-2"
                onClick={(e) => e.stopPropagation()} // Prevent popover from closing
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit status
              </Button>
            </StatusEditDialog>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}