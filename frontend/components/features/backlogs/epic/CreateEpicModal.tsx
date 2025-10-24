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
import { Target } from "lucide-react"

interface CreateEpicModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateEpicModal({ open, onOpenChange }: CreateEpicModalProps) {
  // Placeholder state
  const [epicName, setEpicName] = React.useState("")

  const handleSubmit = () => {
    console.log("Submitting new epic:", epicName)
    // Add logic to actually create the epic
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600"/> Create New Epic
          </DialogTitle>
          <DialogDescription>
            Enter the details for your new epic. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="epic-name" className="text-right">
              Name
            </Label>
            <Input
              id="epic-name"
              value={epicName}
              onChange={(e) => setEpicName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., User Authentication Flow"
            />
          </div>
          {/* Add more fields here later (Description, Priority, etc.) */}
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>Save Epic</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}