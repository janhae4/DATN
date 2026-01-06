"use client"

import * as React from "react"
import { DateRange } from "react-day-picker"
import { Loader2, Circle, CircleEllipsis, CheckCircle2, XCircle, Flag, CircleSlashIcon, Trash2 } from "lucide-react"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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

import { DateRangePicker } from "../DateRangePicker"
import { Epic, EpicStatus, Priority } from "@/types" 
import { useEpics } from "@/hooks/useEpics"
import { ColorPicker } from "../color-picker/ColorPicker"

// --- Maps (Giữ nguyên) ---
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

interface EpicEditDialogProps {
  children: React.ReactNode
  projectId: string
  epics: Epic[] 
}

export function EpicEditDialog({ children, projectId, epics }: EpicEditDialogProps) {
  const [open, setOpen] = React.useState(false)
  const { updateEpic, deleteEpic, isUpdating, isDeleting } = useEpics(projectId)

  const [selectedId, setSelectedId] = React.useState<string | undefined>(epics[0]?.id)
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [status, setStatus] = React.useState<EpicStatus>(EpicStatus.TODO)
  const [priority, setPriority] = React.useState<Priority>(Priority.MEDIUM)
  const [color, setColor] = React.useState("#E06B80")
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined)

  // Load data when selectedId changes
  React.useEffect(() => {
    if (!selectedId) return
    const epicToEdit = epics.find((e) => e.id === selectedId)
    if (epicToEdit) {
      setTitle(epicToEdit.title)
      setDescription(epicToEdit.description || "")
      setStatus(epicToEdit.status as EpicStatus)
      setPriority(epicToEdit.priority as Priority)
      setColor(epicToEdit.color || "#E06B80")
      setDateRange({
        from: epicToEdit.startDate ? new Date(epicToEdit.startDate) : undefined,
        to: epicToEdit.dueDate ? new Date(epicToEdit.dueDate) : undefined,
      })
    }
  }, [selectedId, epics])

  // Reset/Init when open
  React.useEffect(() => {
    if (open && epics.length > 0 && !selectedId) {
      setSelectedId(epics[0].id)
    }
  }, [open, epics, selectedId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedId) return

    try {
      await updateEpic(selectedId, {
            title,
            description: description || undefined,
            status,
            priority,
            color,
            startDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
            dueDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
        }
      )

      toast.success(`Epic "${title}" updated!`)
      setOpen(false)
    } catch (error: any) {
        console.error("Error updating epic:", error)
        toast.error("Failed to update epic.")
    }
  }

  const handleDelete = async () => {
    if (!selectedId) return
    try {
      await deleteEpic(selectedId)
      toast.success(`Epic "${title}" deleted!`)
      setOpen(false)
      // Reset selectedId to the first available epic or undefined
      const remainingEpics = epics.filter(e => e.id !== selectedId)
      setSelectedId(remainingEpics[0]?.id)
    } catch (error: any) {
      console.error("Error deleting epic:", error)
      toast.error("Failed to delete epic.")
    }
  }
  
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
            <DialogTitle>Edit epics</DialogTitle>
            <DialogDescription>Update or delete an existing epic</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label htmlFor="epic-select">Epic *</Label>
              <Select value={selectedId} onValueChange={setSelectedId} disabled={isUpdating || isDeleting}>
                <SelectTrigger id="epic-select" className="w-full">
                  <SelectValue placeholder="Select an epic to edit" />
                </SelectTrigger>
                <SelectContent>
                  {epics.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-sm" style={{ backgroundColor: e.color || '#E06B80' }} />
                        <span>{e.title}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={!selectedId || isUpdating || isDeleting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!selectedId || isUpdating || isDeleting}
                rows={4}
              />
            </div>

            <div className="flex gap-4 w-full">
              <div className="space-y-2 w-full">
                <Label htmlFor="status-edit">Status</Label>
                <Select value={status} onValueChange={(v: EpicStatus) => setStatus(v)} disabled={!selectedId || isUpdating || isDeleting}>
                  <SelectTrigger id="status-edit" className="w-full">
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
                <Label htmlFor="priority-edit">Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as Priority)} disabled={!selectedId || isUpdating || isDeleting}>
                  <SelectTrigger id="priority-edit" className="w-full">
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
                      disabled={!selectedId || isUpdating || isDeleting}
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
              <DateRangePicker range={dateRange} onRangeSelect={setDateRange} disabled={!selectedId || isUpdating || isDeleting} />
            </div>
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="sm"
                  disabled={!selectedId || isUpdating || isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the epic
                    "{title}" and remove it from all associated tasks.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isUpdating || isDeleting}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!selectedId || isUpdating || isDeleting}>
                {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save changes
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}