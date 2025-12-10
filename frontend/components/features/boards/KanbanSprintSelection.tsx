import * as React from "react";
import { Sprint } from "@/types";
import { SprintStatus } from "@/types/common/enums";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Calendar } from "lucide-react";
import { format } from "date-fns";

interface KanbanSprintSelectionProps {
  sprints: Sprint[];
  onStartSprint: (sprintId: string) => void;
}

export function KanbanSprintSelection({ sprints, onStartSprint }: KanbanSprintSelectionProps) {
  const plannedSprints = sprints.filter((s) => s.status === SprintStatus.PLANNED);

  return (
    <div className="flex flex-col w-80 shrink-0 gap-4">
      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-dashed border-muted-foreground/25">
        <h3 className="font-semibold text-sm text-muted-foreground">Select Sprint to Start</h3>
      </div>
      
      <div className="flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-200px)] pr-2">
        {plannedSprints.length === 0 ? (
          <div className="text-center p-8 border-2 border-dashed rounded-lg text-muted-foreground">
            <p>No planned sprints found.</p>
            <p className="text-xs mt-1">Create a sprint in the Backlog to get started.</p>
          </div>
        ) : (
          plannedSprints.map((sprint) => (
            <Card key={sprint.id} className="cursor-pointer hover:border-primary transition-colors group">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex justify-between items-start">
                  <span>{sprint.title}</span>
                </CardTitle>
                <CardDescription className="line-clamp-2 text-xs">
                  {sprint.goal || "No goal set"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex items-center text-xs text-muted-foreground gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {sprint.startDate ? format(new Date(sprint.startDate), "MMM d") : "TBD"} 
                    {" - "}
                    {sprint.endDate ? format(new Date(sprint.endDate), "MMM d") : "TBD"}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button 
                  className="w-full gap-2  transition-opacity" 
                  size="sm"
                  variant="outline"
                  onClick={() => onStartSprint(sprint.id)}
                >
                  <Play className="h-3 w-3" /> Start Sprint
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
