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
import { cn } from "@/lib/utils";

interface CreateChannelDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    parentId: string | null;
    onCreate: (name: string, type: "TEXT" | "VOICE") => void;
}

export const CreateChannelDialog: React.FC<CreateChannelDialogProps> = ({
    open,
    onOpenChange,
    parentId,
    onCreate
}) => {
    const [name, setName] = useState("");
    const [type, setType] = useState<"TEXT" | "VOICE">("TEXT");

    useEffect(() => {
        if (open) {
            setName("");
            setType("TEXT");
        }
    }, [open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onCreate(name.trim(), type);
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 p-0 overflow-hidden sm:max-w-[440px] rounded-2xl">
                <div className="p-6 space-y-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">New Channel</DialogTitle>
                        <DialogDescription className="text-zinc-500">
                            Create a space for discussion in <span className="font-medium text-zinc-900 dark:text-zinc-100">{parentId ? "selected category" : "General"}</span>.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-3">
                            <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Channel Type</Label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { id: "TEXT", icon: "lucide:hash", label: "Text", desc: "Post images, stickers, etc." },
                                    { id: "VOICE", icon: "lucide:volume-2", label: "Voice", desc: "Hang out with voice & video." }
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setType(item.id as any)}
                                        className={cn(
                                            "relative flex flex-col items-start p-3 rounded-xl border-2 transition-all duration-200 text-left",
                                            type === item.id
                                                ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900"
                                                : "border-zinc-100 bg-white hover:border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
                                        )}
                                    >
                                        <div className={cn("mb-2 p-1.5 rounded-md", type === item.id ? "bg-zinc-900 text-white dark:bg-white dark:text-black" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-900")}>
                                            <Icon icon={item.icon} width="16" />
                                        </div>
                                        <span className={cn("text-sm font-semibold", type === item.id ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400")}>{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="newChannelName" className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Name</Label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                                    <Icon icon={type === "TEXT" ? "lucide:hash" : "lucide:volume-2"} width="16" />
                                </div>
                                <Input
                                    id="newChannelName"
                                    value={name}
                                    onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                    className="pl-9 h-11 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus-visible:ring-1 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 placeholder:text-zinc-400 font-medium"
                                    placeholder="new-channel"
                                    autoFocus
                                />
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-4 bg-zinc-50 dark:bg-zinc-900/30 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={!name.trim()} 
                        className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                    >
                        Create Channel
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};