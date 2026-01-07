"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import {
  CalendarDays,
  CheckCircle2,
  LayoutList,
  MoreHorizontal,
  User,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { useSprints } from "@/hooks/useSprints";
import { useTasks } from "@/hooks/useTasks";
import { useLists } from "@/hooks/useList";
import { SprintStatus, ListCategoryEnum } from "@/types";
import { SprintProgressView } from "./SprintProgressView";

export function ProjectSprintsModal({
  projectId,
  teamId,
  isOpen,
  onClose,
}: {
  projectId: string;
  teamId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { sprints, isLoading } = useSprints(projectId, teamId, [
    SprintStatus.ACTIVE,
    SprintStatus.PLANNED,
    SprintStatus.COMPLETED,
  ]);

  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [selectedSprint, setSelectedSprint] = useState<any>(null);

  useEffect(() => {
    if (isOpen && sprints.length > 0 && !selectedSprintId) {
      const active = sprints.find((s) => s.status === SprintStatus.ACTIVE);
      const sprint = active ? active : sprints[0];
      setSelectedSprintId(sprint.id);
      setSelectedSprint(sprint);
    }
  }, [isOpen, sprints, selectedSprintId]);

  useEffect(() => {
    if (selectedSprintId) {
      const sprint = sprints.find((s) => s.id === selectedSprintId);
      setSelectedSprint(sprint || null);
    }
  }, [selectedSprintId, sprints]);

  const handleSprintSelect = (sprint: any) => {
    setSelectedSprintId(sprint.id);
    setSelectedSprint(sprint);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-5xl max-w-[90vw] h-[90vh] flex flex-col p-0 overflow-hidden bg-background border-border shadow-xl">
        <DialogHeader className="px-6 py-4 border-b border-border flex items-center justify-between">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <div className="p-1.5 bg-muted rounded-md border border-border">
              <LayoutList className="h-4 w-4 text-foreground" />
            </div>
            Project Roadmap
          </DialogTitle>
          <div className="text-xs text-muted-foreground">{sprints.length} sprints</div>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Chỉ fetch sprints */}
          <aside className="w-80 border-r border-border flex flex-col bg-muted/30">
            <div className="p-4 pb-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide pl-1">
                Timeline
              </p>
            </div>
            <ScrollArea className="flex-1 px-1">
              <div className="space-y-1 pb-4 px-2">
                {isLoading ? (
                  <SprintListSkeleton />
                ) : (
                  sprints.map((sprint) => (
                    <button
                      key={sprint.id}
                      onClick={() => handleSprintSelect(sprint)}
                      className={cn(
                        "w-full text-left p-3 rounded-xl transition-all duration-200 border border-transparent mb-1",
                        selectedSprintId === sprint.id
                          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 border-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:border-border"
                      )}
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <p className="text-sm font-medium truncate flex-1 pr-2">
                          {sprint.title}
                        </p>
                        {sprint.status === SprintStatus.ACTIVE && (
                          <span className={cn(
                            "h-2 w-2 rounded-full",
                            selectedSprintId === sprint.id ? "bg-primary-foreground" : "bg-primary"
                          )} />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] opacity-80">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span>
                          {sprint.startDate
                            ? format(new Date(sprint.startDate), "dd MMM")
                            : "--"}
                          {" - "}
                          {sprint.endDate
                            ? format(new Date(sprint.endDate), "dd MMM")
                            : "--"}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </aside>

          {/* Main Content - Fetch tasks dựa trên selected sprint */}
          <main className="flex-1 bg-background overflow-hidden flex flex-col">
            {selectedSprint && selectedSprintId ? (
              <SprintProgressView
                teamId={teamId}
                projectId={projectId}
                sprint={selectedSprint}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2">
                <LayoutList className="h-10 w-10 opacity-20" />
                <p className="text-sm font-medium">Select a sprint to view details</p>
              </div>
            )}
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SprintListSkeleton() {
  return (
    <div className="space-y-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-20 w-full rounded-xl" />
      ))}
    </div>
  );
}
