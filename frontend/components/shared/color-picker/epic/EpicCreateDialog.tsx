"use client"

import * as React from "react"
import { DateRange } from "react-day-picker"
import { Loader2, Circle, CircleEllipsis, CheckCircle2, XCircle, Flag, CircleSlashIcon } from "lucide-react"
import { toast } from "sonner"

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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { DateRangePicker } from "../../DateRangePicker"
import { EpicStatus, Priority } from "@/types/common/enums"
import { useEpics } from "@/hooks/useEpics"
import { CreateEpicDto } from "@/services/epicService"
import { ColorPicker } from "../ColorPicker"

// Maps (Same as before)
const statusMap: Record<EpicStatus, { label: string; icon: React.ElementType; color: string }> = {
  [EpicStatus.TODO]: { label: "To do", icon: Circle, color: "text-neutral-500" },
  [EpicStatus.IN_PROGRESS]: { label: "In Progress", icon: CircleEllipsis, color: "text-blue-500" },
  [EpicStatus.DONE]: { label: "Done", icon: CheckCircle2, color: "text-green-500" },
  [EpicStatus.CANCELED]: { label: "Canceled", icon: XCircle, color: "text-red-500" },
}
const statusOptions = Object.values(EpicStatus)

const priorityMap: Record<Priority, { label: string; icon: React.ElementType; color: string }> = {
  [Priority.HIGH]: { label: "High", icon: Flag, color: "text-red-500" },
  [Priority.MEDIUM]: { label: "Medium", icon: Flag, color: "text-yellow-500" },
  [Priority.LOW]: { label: "Low", icon: Flag, color: "text-blue-500" },
  [Priority.URGENT]: { label: "Urgent", icon: Flag, color: "text-red-600" },
}
const priorityOptions = Object.values(Priority)

const nullPriority = {
  label: "No priority",
  icon: CircleSlashIcon,
  color: "text-muted-foreground"
}

interface EpicCreateDialogProps {
  children: React.ReactNode
  projectId: string
}

export function EpicCreateDialog({ children, projectId }: EpicCreateDialogProps) {
  const [open, setOpen] = React.useState(false)
  const { createEpic, isCreating } = useEpics(projectId)

  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [status, setStatus] = React.useState<EpicStatus>(EpicStatus.TODO)
  const [priority, setPriority] = React.useState<Priority>(Priority.MEDIUM)
  const [color, setColor] = React.useState("#E06B80")
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined)

  React.useEffect(() => {
    if (open) {
      setTitle("")
      setDescription("")
      setStatus(EpicStatus.TODO)
      setPriority(Priority.MEDIUM)
      setColor("#E06B80")
      setDateRange(undefined)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error("Title is required")
      return
    }

    try {
      const newEpic: CreateEpicDto = {
        projectId,
        title: title.trim(),
        description: description.trim() || undefined,
        status: status,
        priority: priority,
        color: color,
        startDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
        dueDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
      }

      await createEpic(newEpic)

      toast.success(`Epic "${title}" created!`)
      setOpen(false)
    } catch (error: any) {
      console.error("Error creating epic:", error)
      const message = error?.response?.data?.message || "Failed to create epic."
      toast.error(message)
    }
  }

  // Render Helpers
  const renderOption = (Icon: React.ElementType, label: string, color: string) => (
    <div className="flex items-center gap-2">
      <Icon className={cn("h-4 w-4", color)} />
      <span className="capitalize">{label}</span>
    </div>
  )

  const getPriorityInfo = (p: Priority) => priorityMap[p] || nullPriority;
  const currentPriorityInfo = getPriorityInfo(priority);
  const currentStatusInfo = statusMap[status];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Create epic</DialogTitle>
            <DialogDescription>Add a new epic to your project</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter epic title"
                disabled={isCreating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter epic description (optional)"
                rows={4}
                disabled={isCreating}
              />
            </div>

            <div className="flex gap-4 w-full">
              <div className="space-y-2 w-full">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(v: EpicStatus) => setStatus(v)} disabled={isCreating}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue asChild>
                      {renderOption(currentStatusInfo.icon, currentStatusInfo.label, currentStatusInfo.color)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {renderOption(statusMap[s].icon, statusMap[s].label, statusMap[s].color)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 w-full">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as Priority)} disabled={isCreating}>
                  <SelectTrigger id="priority" className="w-full">
                    <SelectValue asChild>
                      {renderOption(currentPriorityInfo.icon, currentPriorityInfo.label, currentPriorityInfo.color)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((p) => (
                      <SelectItem key={p} value={p}>
                        {renderOption(priorityMap[p].icon, priorityMap[p].label, priorityMap[p].color)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-10 h-10 p-0 rounded-md border shadow-sm"
                      style={{ backgroundColor: color }}
                      type="button"
                    />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3" align="end">
                    <ColorPicker color={color} onChange={setColor} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Start & End date</Label>
              <DateRangePicker range={dateRange} onRangeSelect={setDateRange} disabled={isCreating} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !title.trim()}>
              {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}