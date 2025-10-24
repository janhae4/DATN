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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Rocket } from "lucide-react"

interface CreateSprintModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateSprintModal({ open, onOpenChange }: CreateSprintModalProps) {
  // Placeholder state - you'll add real state and logic later
  const [sprintName, setSprintName] = React.useState("")

  const handleSubmit = () => {
    console.log("Submitting new sprint:", sprintName)
    // Add logic to actually create the sprint (e.g., call context function)
    onOpenChange(false) // Close modal on submit
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
             <Rocket className="h-5 w-5 text-blue-600"/> Create New Sprint
          </DialogTitle>
          <DialogDescription>
            Enter the details for your new sprint. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sprint-name" className="text-right">
              Name
            </Label>
            <Input
              id="sprint-name"
              value={sprintName}
              onChange={(e) => setSprintName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Sprint Alpha - Week 1"
            />
          </div>
          {/* Add more fields here later (Goal, Dates, etc.) */}
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>Save Sprint</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}