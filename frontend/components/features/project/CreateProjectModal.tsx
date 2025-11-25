"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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

const formSchema = z.object({
  name: z.string().min(1, "Project name is required").max(50, "Project name is too long"),
  key: z.string().min(2, "Key must be at least 2 characters").max(10, "Key is too long").toUpperCase(),
  description: z.string().optional(),
  visibility: z.nativeEnum(ProjectVisibility),
});

interface CreateProjectModalProps {
  children: React.ReactNode;
}

export function CreateProjectModal({ children }: CreateProjectModalProps) {
  const [open, setOpen] = React.useState(false);
  const { activeTeam } = useTeamContext();
  const { createProject } = useProjects(activeTeam?.id);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      key: "",
      description: "",
      visibility: ProjectVisibility.TEAM,
    },
  });

  // Auto-generate key from name
  const name = watch("name");
  React.useEffect(() => {
    if (name && !watch("key")) {
      const generatedKey = name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .substring(0, 5);
      setValue("key", generatedKey);
    }
  }, [name, setValue, watch]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!activeTeam) {
      toast.error("No active team selected");
      return;
    }

    try {
      await createProject({
        ...values,
        teamId: activeTeam.id,
        icon: "🚀", // Default icon
      } as any); // Type casting as createProject expects full Project object but service handles ID/dates

      toast.success("Project created successfully!");
      setOpen(false);
      reset();
    } catch (error) {
      toast.error("Failed to create project");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>
            Create a new project in {activeTeam?.name}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <div className="col-span-3">
                <Input
                  id="name"
                  placeholder="Project Phoenix"
                  {...register("name")}
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-destructive text-xs mt-1">{errors.name.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="key" className="text-right">
                Key
              </Label>
              <div className="col-span-3">
                <Input
                  id="key"
                  placeholder="PHX"
                  {...register("key")}
                  className={errors.key ? "border-destructive" : ""}
                />
                {errors.key && (
                  <p className="text-destructive text-xs mt-1">{errors.key.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right mt-2">
                Description
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="description"
                  placeholder="Describe your project..."
                  {...register("description")}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="visibility" className="text-right">
                Visibility
              </Label>
              <div className="col-span-3">
                <Select
                  onValueChange={(value) => setValue("visibility", value as ProjectVisibility)}
                  defaultValue={ProjectVisibility.TEAM}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ProjectVisibility.PRIVATE}>Private</SelectItem>
                    <SelectItem value={ProjectVisibility.TEAM}>Team</SelectItem>
                    <SelectItem value={ProjectVisibility.PUBLIC}>Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
