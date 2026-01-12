"use client";

import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSprints } from "@/hooks/useSprints";
import { toast } from "sonner";
import { Sprint } from "@/types";
import { SprintStatus } from "@/types/common/enums";
import { useTaskManagementContext } from "@/components/providers/TaskManagementContext";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteSprintDialogProps {
    children: React.ReactNode;
    sprint: Sprint;
}

export function DeleteSprintDialog({
    children,
    sprint,
}: DeleteSprintDialogProps) {
    const [open, setOpen] = React.useState(false);
    const [alertOpen, setAlertOpen] = React.useState(false);
    const {
        projectId,
        allData: allTasks,
        sprints,
        handleSprintChange,
    } = useTaskManagementContext();
    const { deleteSprint, isDeleting } = useSprints(projectId, sprint.teamId);

    const [moveToSprintId, setMoveToSprintId] = React.useState<string>("backlog");

    const sprintTasks = React.useMemo(
        () => allTasks.filter((t) => t.sprintId === sprint.id),
        [allTasks, sprint.id]
    );

    const availableSprints = React.useMemo(
        () =>
            sprints.filter(
                (s) =>
                    s.id !== sprint.id &&
                    s.status !== SprintStatus.COMPLETED &&
                    s.status !== SprintStatus.ARCHIVED
            ),
        [sprints, sprint.id]
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (sprintTasks.length > 0) {
                const targetSprintId =
                    moveToSprintId === "backlog" ? null : moveToSprintId;

                const promises = sprintTasks.map((task) =>
                    handleSprintChange(task.id, targetSprintId)
                );
                await Promise.all(promises);
            }

            await deleteSprint(sprint.id);

            toast.success(`Sprint "${sprint.title}" deleted successfully.`);
            setOpen(false);
        } catch (error) {
            console.error("Error deleting sprint:", error);
            toast.error("Failed to delete sprint.");
        }
    };

    // If no tasks, we can either skip the dialog or just show a simple confirmation.
    // But the user said "if tasks remain, use the dialog".

    const handleTriggerClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (sprintTasks.length === 0) {
            setAlertOpen(true);
            return;
        }
        setOpen(true);
    };

    const handleEmptyDelete = async () => {
        try {
            await deleteSprint(sprint.id);
            toast.success(`Sprint "${sprint.title}" deleted.`);
            setAlertOpen(false);
        } catch (error) {
            toast.error("Failed to delete sprint.");
        }
    };

    return (
        <>
            <div onClick={handleTriggerClick} className="cursor-pointer">
                {children}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>Delete Sprint: {sprint.title}</DialogTitle>
                            <DialogDescription>
                                This sprint has {sprintTasks.length} tasks. Where should we move them before deleting?
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-4 space-y-4">
                            <div className="space-y-2">
                                <Label>Move tasks to:</Label>
                                <Select
                                    value={moveToSprintId}
                                    onValueChange={setMoveToSprintId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select destination" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="backlog">Backlog</SelectItem>
                                        {availableSprints.map((s) => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {s.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                variant="ghost"
                                type="button"
                                onClick={() => setOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={isDeleting}
                            >
                                {isDeleting ? "Deleting..." : "Delete Sprint"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the empty sprint "{sprint.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleEmptyDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete Sprint
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
