"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { toast } from "sonner";
import { useProjects } from "@/hooks/useProjects";
import { useTeamContext } from "@/contexts/TeamContext";
import { ProjectVisibility } from "@/types/common/enums";
import { Project } from "@/types";
import { HelpTooltip } from "@/components/shared/HelpTooltip";

const formSchema = z.object({
    name: z.string().min(1, "Project name is required").max(100, "Name is too long"),
    description: z.string().max(500, "Description is too long").optional(),
    visibility: z.nativeEnum(ProjectVisibility),
});

interface EditProjectModalProps {
    project: Project;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditProjectModal({ project, open, onOpenChange }: EditProjectModalProps) {
    const { activeTeam } = useTeamContext();
    const { updateProject } = useProjects(activeTeam?.id);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        values: {
            name: project?.name || "",
            description: project?.description || "",
            visibility: project?.visibility || ProjectVisibility.TEAM,
        },
    });

    const currentVisibility = watch("visibility");

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            await updateProject(project.id, {
                name: values.name,
                description: values.description,
                visibility: values.visibility,
            });

            toast.success("Project updated successfully!");
            onOpenChange(false);
        } catch (error: any) {
            console.error(error);
            const message = error?.response?.data?.message || "Failed to update project";
            toast.error(message);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Project Settings</DialogTitle>
                    <DialogDescription>
                        Update project details and visibility.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="edit-name">Project Name <span className="text-destructive">*</span></Label>
                        <Input
                            id="edit-name"
                            {...register("name")}
                            className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
                        />
                        {errors.name && (
                            <p className="text-destructive text-xs font-medium">{errors.name.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-description">Description</Label>
                        <Textarea
                            id="edit-description"
                            className="resize-none h-20"
                            {...register("description")}
                        />
                        {errors.description && (
                            <p className="text-destructive text-xs font-medium">{errors.description.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-visibility">Visibility <HelpTooltip text="Who can see this project" /></Label>
                        <Select
                            onValueChange={(value) => setValue("visibility", value as ProjectVisibility)}
                            value={currentVisibility}
                            defaultValue={currentVisibility}
                        >
                            <SelectTrigger id="edit-visibility">
                                <SelectValue placeholder="Select visibility" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ProjectVisibility.PRIVATE}>🔒 Private</SelectItem>
                                <SelectItem value={ProjectVisibility.TEAM}>👥 Team</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                                </>
                            ) : (
                                <>Save Changes</>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
