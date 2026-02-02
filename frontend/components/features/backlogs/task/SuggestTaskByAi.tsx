"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Bot,
  Check,
  Loader2,
} from "lucide-react";
import { CreateTaskDto } from "@/services/taskService";
import { useTeamMembers } from "@/hooks/useTeam";
import { ListCategoryEnum, Priority, SprintStatus } from "@/types";
import { useLists } from "@/hooks/useList";
import { useSprints } from "@/hooks/useSprints";
import { useParams } from "next/navigation";

// Imported Sub-components
import { AiTaskInput } from "./ai-suggestion/AiTaskInput";
import { SuggestionSummary } from "./ai-suggestion/SuggestionSummary";
import { AiTaskList } from "./ai-suggestion/AiTaskList";
import { SuggestedTask } from "./ai-suggestion/AiTaskItem";

// --- Interfaces ---
interface SuggestTaskByAiProps {
  children: React.ReactNode;
  onSave?: (tasks: CreateTaskDto[], epic: string, sprintId?: string) => void;
  suggestTaskByAi: ({
    data,
    onChunk,
  }: {
    data: {
      query: string;
      projectId: string;
      teamId: string;
      sprintId: string;
    };
    onChunk: (chunk: string) => void;
  }) => Promise<void>;
}

export function SuggestTaskByAi({
  children,
  onSave,
  suggestTaskByAi,
}: SuggestTaskByAiProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [selectedSprintId, setSelectedSprintId] = React.useState<string | null>(
    null
  );
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [isThinking, setIsThinking] = React.useState(false);
  const [suggestedTasks, setSuggestedTasks] = React.useState<SuggestedTask[]>(
    []
  );
  const [isSaving, setIsSaving] = React.useState(false);
  const [summary, setSummary] = React.useState("");

  const param = useParams();
  const teamId = param?.teamId as string;
  const projectId = param?.projectId as string;
  const { data: members = [] } = useTeamMembers(teamId);
  const { lists } = useLists(projectId);
  const { sprints = [] } = useSprints(projectId, teamId, [
    SprintStatus.PLANNED,
    SprintStatus.ACTIVE,
    SprintStatus.ARCHIVED,
  ]);

  const handleAiSuggest = async () => {
    if (!query.trim()) {
      toast.error("Please enter a description");
      return;
    }

    setIsStreaming(true);
    setIsThinking(true);
    setSuggestedTasks([]);
    setSummary("");

    let accumulatedTasks: SuggestedTask[] = [];
    let buffer = "";

    try {
      await suggestTaskByAi({
        data: {
          teamId,
          projectId,
          query,
          sprintId: selectedSprintId || "",
        },
        onChunk: (chunk: string) => {
          setIsThinking(false);
          buffer += chunk;

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          lines.forEach((line) => {
            const trimmedLine = line.trim();
            if (!trimmedLine.startsWith("data:")) return;

            try {
              const rawData = trimmedLine.replace(/^data:\s*/, "");
              const parsed = JSON.parse(rawData);

              if (parsed.type === "summarized") {
                setSummary(parsed.objective);
              }
              if (parsed.type === "task") {
                const newTask: SuggestedTask = {
                  id: Math.random().toString(36).substr(2, 9),
                  ...parsed,
                  memberIds: parsed.memberId
                    ? [parsed.memberId]
                    : parsed.memberIds || [],
                };
                
                accumulatedTasks = [...accumulatedTasks, newTask];
                setSuggestedTasks([...accumulatedTasks]);
              } else if (parsed.type === "done") {
                setIsThinking(false);
                setIsStreaming(false);
                toast.success("Blueprint generated successfully.");
              }
            } catch (e) {
              console.error("Parse error:", line);
            }
          });
        },
      });
    } catch (error) {
      console.log(error);
      toast.error("AI Architect is offline.");
    } finally {
      setIsStreaming(false);
      setIsThinking(false);
    }
  };

  const targetList = lists?.find(
    (l) =>
      l.category === ListCategoryEnum.TODO ||
      l.name.toLowerCase().includes("to do")
  );

  const handleImport = async (tasks: SuggestedTask[]) => {
    if (!targetList) {
      toast.error("Missing 'To Do' list destination.");
      return;
    }

    const normalizedTasks: CreateTaskDto[] = tasks.map((t) => {
      const hasSprint = !!selectedSprintId;
      return {
        title: t.title,
        description: hasSprint ? `AI Suggestion: ${t.reason}` : "",
        sprintId: selectedSprintId,
        projectId: projectId,
        listId: targetList.id,
        priority: Priority.MEDIUM,
        teamId: teamId,
        skillName: t.skillName,
        exp: t.experience,
        reporterId: null,
        assigneeIds: t.memberIds,
        startDate: t.startDate ? new Date(t.startDate).toISOString() : null,
        dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : null,
      };
    });

    if (onSave) {
      onSave(normalizedTasks, summary || query, selectedSprintId || undefined);
    }
    setOpen(false);
  };

  const toggleMember = (taskId: string, memberId: string) => {
    setSuggestedTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const exists = t.memberIds.includes(memberId);
          return {
            ...t,
            memberIds: exists
              ? t.memberIds.filter((id) => id !== memberId)
              : [...t.memberIds, memberId],
          };
        }
        return t;
      })
    );
  };

  const handleUpdateTask = (taskId: string, updates: Partial<SuggestedTask>) => {
    setSuggestedTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setSuggestedTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-2xl">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-zinc-200/50 bg-white dark:bg-zinc-950 dark:border-zinc-800 z-20">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-700 dark:from-zinc-100 dark:to-zinc-300 text-white dark:text-zinc-900 shadow-lg shadow-zinc-900/10 dark:shadow-none">
              <Bot className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <DialogTitle className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                AI Architect
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Describe your goal and let AI build the roadmap.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 space-y-6">
            <AiTaskInput
              query={query}
              setQuery={setQuery}
              selectedSprintId={selectedSprintId}
              setSelectedSprintId={setSelectedSprintId}
              sprints={sprints}
              isStreaming={isStreaming}
              onGenerate={handleAiSuggest}
            />

            <div className="space-y-5 min-h-[100px]">
              <SuggestionSummary summary={summary} setSummary={setSummary} />

              <AiTaskList
                suggestedTasks={suggestedTasks}
                isThinking={isThinking}
                members={members}
                selectedSprintId={selectedSprintId}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onToggleMember={toggleMember}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="px-6 py-4 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800">
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={isStreaming}
            className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              setIsSaving(true);
              try {
                await handleImport(suggestedTasks);
                toast.success(
                  `Successfully imported ${suggestedTasks.length} tasks.`
                );
              } catch (error) {
                console.error("Import error:", error);
                toast.error("Failed to save tasks.");
              } finally {
                setIsSaving(false);
              }
            }}
            disabled={suggestedTasks.length === 0 || isStreaming || isSaving}
            className="shadow-sm dark:shadow-none min-w-[120px] bg-zinc-900 text-white hover:bg-zinc-950 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Import Tasks
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
