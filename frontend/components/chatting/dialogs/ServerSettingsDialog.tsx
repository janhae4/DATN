import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify-icon/react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface ServerSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    serverName: string;
    onUpdate: (name: string) => void;
    onDelete: () => void;
}

export const ServerSettingsDialog: React.FC<ServerSettingsDialogProps> = ({
    open,
    onOpenChange,
    serverName,
    onUpdate,
    onDelete
}) => {
    const [editName, setEditName] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (open) {
            setEditName(serverName || "");
        }
    }, [open, serverName]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editName.trim()) {
            onUpdate(editName.trim());
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 p-0 overflow-hidden sm:max-w-[480px] rounded-2xl gap-0">
                <div className="px-6 py-6 border-b border-zinc-100 dark:border-zinc-800">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Icon icon="lucide:settings" width="20" className="text-zinc-400" />
                            {serverName}
                        </DialogTitle>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-8">
                    {/* General Settings */}
                    <form id="server-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Server Name</Label>
                            <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus-visible:ring-1 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 font-medium"
                            />
                            <p className="text-[11px] text-zinc-500">This name will be visible to all members.</p>
                        </div>
                    </form>

                    <Separator className="bg-zinc-100 dark:bg-zinc-800" />

                    {/* Danger Zone */}
                    <div className="space-y-3">
                        <Label className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Danger Zone</Label>
                        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
                            <div className="space-y-0.5">
                                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-200">Delete Server</span>
                                <p className="text-xs text-zinc-500">This action cannot be undone.</p>
                            </div>
                            <Button
                                variant="ghost"
                                onClick={() => isDeleting ? onDelete() : setIsDeleting(true)}
                                onMouseLeave={() => setIsDeleting(false)}
                                className={cn(
                                    "h-9 px-4 font-medium transition-all duration-200 border",
                                    isDeleting
                                        ? "bg-red-600 border-red-600 text-white hover:bg-red-700 hover:text-white"
                                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-red-600 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 dark:hover:border-red-900"
                                )}
                            >
                                {isDeleting ? "Confirm?" : "Delete"}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900/30 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        type="submit"
                        form="server-form"
                        disabled={editName === serverName}
                        className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black"
                    >
                        Save Changes
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
