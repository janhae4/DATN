"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus } from "lucide-react";

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
import { useAuth } from "@/contexts/AuthContext"; // Import useAuth
import { ProjectVisibility } from "@/types/common/enums"; // Đảm bảo đường dẫn import đúng
import { useRouter } from "next/navigation";

const formSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100, "Name is too long"),
  description: z.string().max(500, "Description is too long").optional(),
  visibility: z.nativeEnum(ProjectVisibility),
});

interface CreateProjectModalProps {
  children: React.ReactNode;
}

export function CreateProjectModal({ children }: CreateProjectModalProps) {
  const [open, setOpen] = React.useState(false);
  const { activeTeam } = useTeamContext();
  const { user } = useAuth(); // Lấy user hiện tại
  const router = useRouter();
  // Hook gọi API tạo project
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
      description: "",
      visibility: ProjectVisibility.TEAM,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!activeTeam) {
      toast.error("Please select a team first.");
      return;
    }

    if (!user) {
        toast.error("You must be logged in.");
        return;
    }

    try {

      const newProject = await createProject({
        name: values.name,
        description: values.description,
        visibility: values.visibility,
        teamId: activeTeam.id,
        icon: "🚀",
        isArchived: false
      });


      toast.success("Project created successfully!");
      setOpen(false);
      reset(); 
      // Redirect to the new project's dashboard or refresh the project list
      router.replace(`/${activeTeam.id}/${newProject.id}/dashboard`);
      
    } catch (error: any) {
      console.error(error);
      const message = error?.response?.data?.message || "Failed to create project";
      toast.error(message);
    }
  };

  // Reset form khi đóng modal
  React.useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>
            Add a new project to <span className="font-semibold text-foreground">{activeTeam?.name}</span> to start tracking tasks.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">Project Name <span className="text-destructive">*</span></Label>
            <Input
              id="name"
              placeholder="e.g. Website Redesign"
              {...register("name")}
              className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {errors.name && (
              <p className="text-destructive text-xs font-medium">{errors.name.message}</p>
            )}
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What is this project about?"
              className="resize-none h-20"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-destructive text-xs font-medium">{errors.description.message}</p>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                </>
              ) : (
                <>Create Project</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}