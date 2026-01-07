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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useTeam } from "@/hooks/useTeam";
import { Member } from "@/types/social";

interface TransferOwnershipDialogProps {
    children: React.ReactNode;
    teamId: string;
    member: Member;
    onSuccess?: () => void;
}

export function TransferOwnershipDialog({
    children,
    teamId,
    member,
    onSuccess,
}: TransferOwnershipDialogProps) {
    const [open, setOpen] = useState(false);
    const [confirmation, setConfirmation] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { transferOwnership } = useTeam(teamId);

    const handleTransfer = async () => {
        if (confirmation !== "CONFIRM") return;

        try {
            setIsLoading(true);
            await transferOwnership(member.id);
            toast.success(`Ownership transferred to ${member.name}`);
            setOpen(false);
            onSuccess?.();
        } catch (error: any) {
            toast.error(error.message || "Failed to transfer ownership");
        } finally {
            setIsLoading(false);
            setConfirmation("");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <ShieldAlert className="h-5 w-5" /> Transfer Team Ownership
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you want to transfer ownership of this team to{" "}
                        <span className="font-bold text-foreground">{member.name}</span>?
                        <br />
                        <br />
                        <span className="font-semibold text-red-600">
                            Warning: This action cannot be undone. You will lose owner privileges
                            and become a Member.
                        </span>
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="confirmation">
                            Type <span className="font-mono font-bold">CONFIRM</span> to proceed
                        </Label>
                        <Input
                            id="confirmation"
                            value={confirmation}
                            onChange={(e) => setConfirmation(e.target.value)}
                            placeholder="CONFIRM"
                            className="border-red-200 focus-visible:ring-red-500"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleTransfer}
                        disabled={confirmation !== "CONFIRM" || isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Transferring...
                            </>
                        ) : (
                            "Transfer Ownership"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
