"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Task } from "@/types"
import { CheckCircle2, AlertTriangle, GitCommit } from "lucide-react"

interface ResolveSubtasksDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  onCancel: () => void
  onIgnoreAndComplete: () => void
  subtasks: Task[]
}

export function ResolveSubtasksDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  onIgnoreAndComplete,
  subtasks,
}: ResolveSubtasksDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent >
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>Unfinished Subtasks</DialogTitle>
          </div>
          <DialogDescription>
            This task has <strong>{subtasks.length}</strong> unfinished subtasks. 
            Moving this task to <strong>Done</strong> will also mark all these subtasks as complete.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="rounded-md border bg-muted/30 max-h-[200px] overflow-y-auto">
            {subtasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 border-b last:border-0 text-sm"
              >
                <GitCommit className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium truncate">{task.title}</span>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className=" sm:gap-0">
        <div className="flex gap-2">

          <Button variant="ghost" onClick={onIgnoreAndComplete} className="gap-2 text-muted-foreground">
            Ignore & Complete
          </Button>
          <Button  onClick={onConfirm} className="gap-2 ">
            <CheckCircle2 className="h-4 w-4" />
            Complete All & Move
          </Button>
        </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}