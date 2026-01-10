"use client";

import * as React from "react";
import {
  Folder,
  MoreHorizontal,
  Plus,
  Trash2,
  type LucideIcon,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "../ui/button";
import Link from "next/link";
import { CreateProjectModal } from "../features/project/CreateProjectModal";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTeamContext } from "@/contexts/TeamContext";
import { MemberRole } from "@/types/common/enums";
import { useParams, useRouter } from "next/navigation";
import { useProjects } from "@/hooks/useProjects";
import { toast } from "sonner";
import { Project } from "@/types";
import { EditProjectModal } from "../features/project/EditProjectModal";
import { Settings2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function NavProjects({
  projects,
}: {
  projects: {
    id: string;
    name: string;
    url: string;
    icon: LucideIcon;
    raw: Project;
  }[];
}) {
  const { isMobile } = useSidebar();
  const { activeTeam } = useTeamContext();
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string;
  const currentProjectId = params.projectId as string;
  const { deleteProject } = useProjects(teamId);
  const { user } = useAuth();

  const isAdmin =
    activeTeam?.role === MemberRole.OWNER ||
    activeTeam?.role === MemberRole.ADMIN ||
    activeTeam?.ownerId === user?.id;

  const [projectToDelete, setProjectToDelete] = React.useState<string | null>(null);
  const [projectToEdit, setProjectToEdit] = React.useState<Project | null>(null);

  const handleDelete = async () => {
    if (!projectToDelete) return;
    try {
      console.log("Attempting to delete project:", projectToDelete);
      await deleteProject(projectToDelete);
      toast.success("Project deleted successfully");

      // Redirect if current project is deleted
      if (currentProjectId === projectToDelete) {
        router.push(`/${teamId}`);
      }
    } catch (error) {
      console.error("Delete project failed:", error);
      toast.error("Failed to delete project");
    } finally {
      setProjectToDelete(null);
    }
  };

  return (
    <>
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>
          <div className="flex justify-between w-full items-center">
            <span className="text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0 group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0">
              Projects
            </span>

            <CreateProjectModal>
              <span className="flex">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Plus />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Create project</p>
                  </TooltipContent>
                </Tooltip>
              </span>
            </CreateProjectModal>
          </div>
        </SidebarGroupLabel>
        <SidebarMenu>
          {projects.length === 0 ? (
            <SidebarMenuItem>
              <CreateProjectModal>
                <SidebarMenuButton className="text-sidebar-foreground/70">
                  <Plus className="h-4 w-4" />
                  <span>Create new project</span>
                </SidebarMenuButton>
              </CreateProjectModal>
            </SidebarMenuItem>
          ) : (
            projects.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton asChild>
                  <Link href={item.url}>
                    <item.icon />
                    <span className="truncate max-w-[120px]">{item.name}</span>
                  </Link>
                </SidebarMenuButton>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuAction showOnHover>
                      <MoreHorizontal />
                      <span className="sr-only">More</span>
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-48 rounded-lg"
                    side={isMobile ? "bottom" : "right"}
                    align={isMobile ? "end" : "start"}
                  >
                    <DropdownMenuItem asChild>
                      <Link href={`/${teamId}/${item.id}/dashboard`}>
                        <Folder className="text-muted-foreground" />
                        <span>View Project</span>
                      </Link>
                    </DropdownMenuItem>

                    {isAdmin && (
                      <>
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            setProjectToEdit(item.raw);
                          }}
                        >
                          <Settings2 className="text-muted-foreground mr-2 h-4 w-4" />
                          <span>Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={(e) => {
                            e.preventDefault();
                            setProjectToDelete(item.id);
                          }}
                        >
                          <Trash2 className="text-muted-foreground mr-2 h-4 w-4" />
                          <span>Delete Project</span>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            ))
          )}
        </SidebarMenu>
      </SidebarGroup>

      <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project and all of its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {projectToEdit && (
        <EditProjectModal
          project={projectToEdit}
          open={!!projectToEdit}
          onOpenChange={(open) => !open && setProjectToEdit(null)}
        />
      )}
    </>
  );
}
