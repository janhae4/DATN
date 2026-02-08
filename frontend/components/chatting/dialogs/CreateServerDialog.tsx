import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify-icon/react";

interface CreateServerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreate: (name: string) => void;
    loading?: boolean;
}

export const CreateServerDialog: React.FC<CreateServerDialogProps> = ({
    open,
    onOpenChange,
    onCreate,
    loading = false
}) => {
    const [name, setName] = useState("");

    useEffect(() => {
        if (open) setName("");
    }, [open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onCreate(name.trim());
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 p-0 gap-0 overflow-hidden sm:max-w-[400px] rounded-2xl">
                <div className="p-6 pb-0">
                    <DialogHeader className="mb-4">
                        <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-2">
                            <Icon icon="lucide:plus" width="20" className="text-zinc-900 dark:text-zinc-100" />
                        </div>
                        <DialogTitle className="text-xl font-semibold tracking-tight">Create a Server</DialogTitle>
                        <DialogDescription className="text-zinc-500 text-sm">
                            Your new space needs a name. You can always change it later.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="serverName" className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Server Name</Label>
                            <Input
                                id="serverName"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="h-11 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 focus-visible:ring-offset-0 placeholder:text-zinc-400"
                                placeholder="e.g. Acme Corp"
                                autoFocus
                            />
                        </div>
                    </form>
                </div>

                <div className="p-6 bg-zinc-50/50 dark:bg-zinc-900/50 mt-6 flex justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800">
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => onOpenChange(false)}
                        className="border-zinc-200 hover:bg-white hover:text-zinc-900 dark:border-zinc-800 dark:bg-transparent dark:hover:bg-zinc-900 dark:text-zinc-300"
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSubmit}
                        disabled={!name.trim() || loading} 
                        className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-black dark:hover:bg-zinc-200 min-w-[100px]"
                    >
                        {loading ? <Icon icon="lucide:loader-2" className="animate-spin" /> : "Create"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};