"use client";

import { FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateProjectModal } from "./CreateProjectModal";

export function EmptyProjectState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center animate-in fade-in-50">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <FolderPlus className="h-10 w-10 text-muted-foreground" />
      </div>
      <div className="max-w-md space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">No projects found</h2>
        <p className="text-muted-foreground">
          This team doesn't have any projects yet. Create your first project to get started.
        </p>
      </div>
      <CreateProjectModal>
        <Button size="lg" className="mt-4">
          <FolderPlus className="mr-2 h-4 w-4" />
          Create Project
        </Button>
      </CreateProjectModal>
    </div>
  );
}
