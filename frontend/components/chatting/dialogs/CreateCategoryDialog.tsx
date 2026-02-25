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

interface CreateCategoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreate: (name: string) => void;
}

export const CreateCategoryDialog: React.FC<CreateCategoryDialogProps> = ({
    open,
    onOpenChange,
    onCreate
}) => {
    const [name, setName] = useState("");

    useEffect(() => {
        if (open) {
            setName("");
        }
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
            <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Category</DialogTitle>
                    <DialogDescription className="text-zinc-500 dark:text-zinc-400">
                        Organize your channels into categories.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 mt-2">
                    <div className="grid gap-2">
                        <Label htmlFor="categoryName" className="text-zinc-700 dark:text-zinc-300">Category Name</Label>
                        <Input
                            id="categoryName"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-zinc-100 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus:ring-zinc-400 dark:focus:ring-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                            placeholder="New Category"
                            autoFocus
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!name.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            Create Category
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
