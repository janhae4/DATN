"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldAlert, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useRemoveMember } from "@/hooks/useTeam"; // Assuming this hook exists or we create it
import { Member } from "@/types/social";
import { useAuth } from "@/contexts/AuthContext";

interface RemoveMemberDialogProps {
    children: React.ReactNode;
    teamId: string;
    member: Member;
    onSuccess?: () => void;
}

export function RemoveMemberDialog({
    children,
    teamId,
    member,
    onSuccess,
}: RemoveMemberDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { mutateAsync: removeMember } = useRemoveMember();
    const { user } = useAuth(); // To get requesterId

    const handleRemove = async () => {
        if (!user) return;

        try {
            setIsLoading(true);
            await removeMember({
                teamId,
                memberIds: [member.id],
                requesterId: user.id,
            });
            toast.success(`${member.name} has been removed from the team.`);
            setOpen(false);
            onSuccess?.();
        } catch (error: any) {
            toast.error(error.message || "Failed to remove member");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" /> Remove Member
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you want to remove{" "}
                        <span className="font-bold text-foreground">{member.name}</span> from
                        the team?
                        <br />
                        <br />
                        This user will lose access to all team projects, tasks, and discussions immediately.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleRemove}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Removing...
                            </>
                        ) : (
                            "Remove Member"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
