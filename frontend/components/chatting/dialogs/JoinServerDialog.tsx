import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify-icon/react";

interface JoinServerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onJoin: (code: string) => void;
}

export const JoinServerDialog: React.FC<JoinServerDialogProps> = ({
    open,
    onOpenChange,
    onJoin
}) => {
    const [code, setCode] = useState("");

    useEffect(() => {
        if (open) setCode("");
    }, [open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (code.trim()) {
            onJoin(code.trim());
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 p-0 overflow-hidden sm:max-w-[400px] rounded-2xl">
                <div className="p-6 text-center">
                    <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-900 mx-auto flex items-center justify-center mb-4">
                        <Icon icon="lucide:compass" width="28" className="text-zinc-900 dark:text-zinc-100" />
                    </div>
                    <DialogTitle className="text-xl font-bold mb-2">Join a Server</DialogTitle>
                    <DialogDescription className="text-zinc-500 mb-6 max-w-[80%] mx-auto">
                        Enter the invite code below to join an existing server.
                    </DialogDescription>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2 text-left">
                            <Label htmlFor="inviteCode" className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1">Invite Code</Label>
                            <Input
                                id="inviteCode"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="h-12 text-center text-lg font-mono tracking-widest bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 uppercase placeholder:tracking-normal placeholder:normal-case"
                                placeholder="h83k-29za..."
                                autoFocus
                            />
                        </div>
                        <Button 
                            type="submit" 
                            disabled={!code.trim()} 
                            className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-black dark:hover:bg-zinc-200 font-semibold text-md"
                        >
                            Join Server
                        </Button>
                    </form>
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900/30 text-center border-t border-zinc-100 dark:border-zinc-800">
                    <p className="text-xs text-zinc-400">Don't have an invite? Ask the server admin.</p>
                </div>
            </DialogContent>
        </Dialog>
    );
};