"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { db } from "@/public/mock-data/mock-data"
import { toast } from "sonner"
import { statusEnum } from "@/types/status.interface"
// 1. IMPORT ICON
import { Circle, CircleEllipsis, CheckCircle2 } from "lucide-react"
// 2. IMPORT CN (ĐỂ NỐI CLASS)
import { cn } from "@/lib/utils"

// 3. UPDATE CATEGORY MAP (THÊM CLASS MÀU)
const categoryMap = {
  [statusEnum.todo]: {
    label: "To do",
    icon: Circle,
    color: "text-neutral-500", // Màu xám
  },
  [statusEnum.in_progress]: {
    label: "In progress",
    icon: CircleEllipsis,
    color: "text-blue-500", // Màu xanh dương
  },
  [statusEnum.done]: {
    label: "Done",
    icon: CheckCircle2,
    color: "text-green-500", // Màu xanh lá
  },
}

interface StatusEditDialogProps {
  children: React.ReactNode
  onSave: () => void
  key?: any
}

export function StatusEditDialog({
  children,
  onSave,
}: StatusEditDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [statuses, setStatuses] = React.useState(db.statuses)
  const [selectedId, setSelectedId] = React.useState<string | undefined>(
    statuses[0]?.id
  )
  const [name, setName] = React.useState(statuses[0]?.name || "")
  const [category, setCategory] = React.useState<statusEnum>(
    statuses[0]?.status || statusEnum.todo
  )

  // Tất cả logic useEffect và handleSubmit giữ nguyên
  React.useEffect(() => {
    if (open) {
      const currentStatuses = db.statuses
      setStatuses(currentStatuses)
      if (!selectedId && currentStatuses.length > 0) {
        setSelectedId(currentStatuses[0].id)
      } else {
        const statusToEdit = currentStatuses.find((s) => s.id === selectedId)
        if (statusToEdit) {
          setName(statusToEdit.name)
          setCategory(statusToEdit.status)
        }
      }
    }
  }, [open, selectedId])

  React.useEffect(() => {
    if (!selectedId) return
    const statusToEdit = statuses.find((s) => s.id === selectedId)
    if (statusToEdit) {
      setName(statusToEdit.name)
      setCategory(statusToEdit.status)
    }
  }, [selectedId, statuses])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Logic Edit
    const statusIndex = db.statuses.findIndex((s) => s.id === selectedId)
    if (statusIndex !== -1) {
      db.statuses[statusIndex] = {
        ...db.statuses[statusIndex],
        name: name,
        status: category,
        updatedAt: new Date().toISOString(),
      }
      toast.success(`Status "${name}" updated!`)
      onSave()
      setOpen(false)
    } else {
      toast.error("Status not found")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Edit status</DialogTitle>
            <DialogDescription>
              Update an existing status
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 1. Dropdown chọn Status (giữ nguyên) */}
            <div className="space-y-2">
              <Label htmlFor="status-select">Status *</Label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger id="status-select" className="w-full">
                  <SelectValue placeholder="Select a status to edit" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-2 px-2 py-1.5"
                    >
                      <span
                        className="h-2 w-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: s.color }}
                      />
                      <SelectItem value={s.id} className="flex-1">
                        {s.name}
                      </SelectItem>
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 2. Input Tên (giữ nguyên) */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!selectedId}
                placeholder="Enter status name"
                className="w-full"
              />
            </div>

            {/* 3. Dropdown Category (UPDATE TƯƠNG TỰ FILE CREATE) */}
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={category}
                onValueChange={(value: statusEnum) => setCategory(value)}
                disabled={!selectedId}
              >
                <SelectTrigger id="category" className="w-full">
                  <SelectValue placeholder="Select a category">
                    {/* 4. UPDATE SELECT TRIGGER (THÊM MÀU) */}
                    <div className="flex items-center gap-2">
                      {React.createElement(categoryMap[category].icon, {
                        className: cn("h-4 w-4", categoryMap[category].color),
                      })}
                      <span>{categoryMap[category].label}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {/* 5. UPDATE SELECT CONTENT (THÊM MÀU) */}
                  {Object.values(statusEnum).map((enumValue) => {
                    const categoryInfo = categoryMap[enumValue]
                    return (
                      <SelectItem key={enumValue} value={enumValue}>
                        <div className="flex items-center gap-2">
                          <categoryInfo.icon
                            className={cn("h-4 w-4", categoryInfo.color)}
                          />
                          <span>{categoryInfo.label}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={!selectedId}>
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}