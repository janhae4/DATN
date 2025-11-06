"use client"

import * as React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Status, statusEnum } from "@/types/status.interaface"

type StatusPickerProps = {
  statuses: Status[]
  value?: string | null
  onChange: (statusId: string) => void
  disabled?: boolean
}

export function StatusPicker({ statuses, value, onChange, disabled }: StatusPickerProps) {
  const grouped = React.useMemo(() => {
    return {
      todo: statuses.filter((s) => s.status === statusEnum.todo),
      in_progress: statuses.filter((s) => s.status === statusEnum.in_progress),
      done: statuses.filter((s) => s.status === statusEnum.done),
    }
  }, [statuses])

  const [open, setOpen] = React.useState(false)

  const renderSection = (title: string, items: Status[]) => {
    if (!items || items.length === 0) return null
    return (
      <div className="py-1">
        <div className="px-3 py-1 text-xs font-semibold text-muted-foreground">{title}</div>
        <div className="space-y-1">
          {items.map((s) => (
            <button
              key={s.id}
              type="button"
              className={cn("w-full flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-muted ", value === s.id ? "bg-primary/5" : "")}
              onClick={() => {
                onChange(s.id)
                setOpen(false)
              }}
            >
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
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
        <Button variant="ghost" size="sm" disabled={disabled} className="h-7 px-2 flex items-center gap-2">
          {(() => {
            const selected = statuses.find((s) => s.id === value)
            if (!selected) return <span>Status</span>
            return (
              <>
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: selected.color }}></span>
                <span className="truncate">{selected.name}</span>
              </>
            )
          })()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0">
        <div className="flex flex-col">
          {renderSection("Not started", grouped.todo)}
          {renderSection("Active", grouped.in_progress)}
          {renderSection("Done", grouped.done)}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default StatusPicker
