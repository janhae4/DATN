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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  BrainCircuit,
  CalendarIcon,
  Check,
  Clock,
  Layers,
  Loader2,
  Plus,
  Sparkles,
  Terminal,
  Trash2,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CreateTaskDto, taskService } from "@/services/taskService";
import { useTask, useTasks } from "@/hooks/useTasks";
import { useParams } from "next/navigation";
import { useTeamMembers } from "@/hooks/useTeam";
import { ListCategoryEnum, MemberRole, Priority, UserSkill } from "@/types";
import { useLists } from "@/hooks/useList";
import { useSprints } from "@/hooks/useSprints";

interface SuggestedTask {
  id: string;
  title: string;
  memberIds: string[];
  skillName: string;
  experience: number;
  reason: string;
  startDate: string;
  dueDate: string;
  type: string;
}

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
  const [skillSearch, setSkillSearch] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [summary, setSummary] = React.useState("");

  const param = useParams();
  const teamId = param?.teamId as string;
  const projectId = param?.projectId as string;
  const { data: members = [], isLoading: isMembersLoading } =
    useTeamMembers(teamId);
  const { lists } = useLists(projectId);
  const { sprints = [] } = useSprints(projectId);

  const scrollRef = React.useRef<HTMLDivElement>(null);

  const handleAiSuggest = async () => {
    if (!query.trim()) {
      toast.error("Please enter a description");
      return;
    }

    setIsStreaming(true);
    setIsThinking(true);
    setSuggestedTasks([]);

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
                toast.info("AI has summarized your request.");
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
                toast.success("AI has finished processing!");
              }
            } catch (e) {
              console.error("Lỗi parse stream line:", line);
            }
          });
        },
      });
    } catch (error) {
      console.log(error);
      toast.error("Không thể kết nối với AI Architect.");
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
      toast.error(
        "Không tìm thấy cột 'To Do' để gán task. Vui lòng kiểm tra lại dự án."
      );
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
        reporterId: null,
        assigneeIds: t.memberIds,
        startDate: t.startDate ? new Date(t.startDate).toISOString() : null,
        dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : null,
      };
    });

    if (onSave) {
      console.log("normalizedTasks", normalizedTasks);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] flex flex-col overflow-hidden border-zinc-200 bg-white p-0 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        <DialogHeader className="p-5 border-b bg-white dark:bg-zinc-950 z-10">
          <DialogTitle className="flex items-center gap-2.5 text-xl font-semibold tracking-tight">
            <div className="p-2 bg-zinc-900 text-white rounded-lg dark:bg-zinc-100 dark:text-zinc-900">
              <Terminal className="h-4 w-4" />
            </div>
            AI Task Architect
          </DialogTitle>
          <DialogDescription className="text-zinc-500 dark:text-zinc-400">
            Define your objective and let AI generate a structured roadmap.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  Target Sprint
                </Label>
                {query && (
                  <span className="text-[10px] text-zinc-400 opacity-60">
                    {query.length} chars
                  </span>
                )}
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between bg-zinc-50/50 border-dashed h-9 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Layers className="h-3.5 w-3.5 text-zinc-400" />
                      {selectedSprintId
                        ? sprints.find((s) => s.id === selectedSprintId)?.title
                        : "No Sprint (Manual Mode)"}
                    </div>
                    <Plus className="h-3 w-3 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search sprint..." />
                    <CommandList>
                      <CommandEmpty>No sprint found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => setSelectedSprintId(null)}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedSprintId === null
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          None (Manual Mode)
                        </CommandItem>
                        {sprints.map((sprint) => (
                          <CommandItem
                            key={sprint.id}
                            onSelect={() => setSelectedSprintId(sprint.id)}
                            className="cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedSprintId === sprint.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {sprint.title}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            {/* Input Area */}
            <div className="relative group">
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Describe your project goal..."
                className="min-h-[100px] max-h-[150px] overflow-y-scroll bg-zinc-50/30 border-zinc-200 focus-visible:ring-zinc-400 resize-none p-3 pb-12 text-sm transition-all"
              />
              <Button
                onClick={handleAiSuggest}
                disabled={isStreaming || !query.trim()}
                size="sm"
                className="absolute bottom-2 right-2 h-8 rounded-lg shadow-sm opacity-40 hover:opacity-100 transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isStreaming ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-2" />
                ) : (
                  <Sparkles className="h-3 w-3 mr-2" />
                )}
                {isStreaming ? "Thinking" : "Generate"}
              </Button>
            </div>

            {summary && (
              <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 shadow-sm animate-in fade-in zoom-in-95 duration-500 dark:border-zinc-800 dark:bg-zinc-900/30">
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-zinc-200/20 blur-3xl dark:bg-zinc-700/10" />

                <div className="relative flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-lg dark:bg-zinc-100 dark:text-zinc-900">
                      <BrainCircuit className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Identified Goal
                    </span>
                  </div>

                  <div className="group relative">
                    <Input
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      className="h-11 border-zinc-200 bg-white/80 pr-12 text-sm font-semibold tracking-tight shadow-none transition-all focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-700 dark:focus:ring-zinc-900/20"
                      placeholder="Edit roadmap title..."
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 transition-opacity group-focus-within:opacity-100">
                      <Terminal className="h-3.5 w-3.5 text-zinc-400" />
                    </div>
                  </div>

                  <p className="px-1 text-[10px] leading-relaxed text-zinc-400">
                    AI has extracted this core objective. This will be used as
                    the primary title for your imported tasks.
                  </p>
                </div>
              </div>
            )}
            {/* Results Area */}
            <div
              ref={scrollRef}
              className="min-h-[160px] max-h-[280px] overflow-y-auto rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 transition-all dark:border-zinc-800 dark:bg-zinc-900/30"
            >
              {suggestedTasks.length === 0 && !isThinking && (
                <div className="h-[128px] flex flex-col items-center justify-center text-zinc-400 gap-3 border-2 border-dashed border-zinc-200 rounded-lg dark:border-zinc-800">
                  <BrainCircuit className="h-6 w-6 opacity-20" />
                  <p className="text-[13px] font-medium">
                    No tasks generated yet.
                  </p>
                </div>
              )}

              {suggestedTasks.length === 0 && isThinking && (
                <div className="h-[128px] flex flex-col items-center justify-center gap-4 text-zinc-500">
                  <div className="relative flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-zinc-300 dark:text-zinc-700" />
                    <BrainCircuit className="absolute h-4 w-4 animate-pulse text-zinc-900 dark:text-zinc-100" />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-sm font-semibold animate-pulse">
                      Architecting roadmap...
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      AI is analyzing your objective
                    </p>
                  </div>
                </div>
              )}
              {suggestedTasks.length > 0 && (
                <div className="space-y-3">
                  {suggestedTasks.map((task, idx) => (
                    <div
                      key={task.id}
                      className="group relative flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm transition-all hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex-none flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-[10px] text-white dark:bg-zinc-100 dark:text-zinc-900">
                          {idx + 1}
                        </div>

                        <div className="flex-1 space-y-1.5 min-w-0">
                          <Input
                            value={task.title}
                            onChange={(e) => {
                              const newTasks = [...suggestedTasks];
                              newTasks[idx].title = e.target.value;
                              setSuggestedTasks(newTasks);
                            }}
                            className="h-7 border-none bg-transparent p-0 text-sm font-semibold focus-visible:ring-0 shadow-none"
                          />

                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button className="inline-flex items-center rounded-md bg-blue-50/50 px-2 py-0.5 text-[10px] font-bold text-blue-700 ring-1 ring-inset ring-blue-700/10 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400">
                                    <BrainCircuit className="mr-1 h-3 w-3" />
                                    {task.skillName || "Add Skill"}
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-[200px] p-0"
                                  align="start"
                                >
                                  <Command shouldFilter={false}>
                                    <CommandInput
                                      placeholder="Type new skill..."
                                      value={skillSearch}
                                      onValueChange={setSkillSearch}
                                      className="h-8 text-xs"
                                    />
                                    <CommandList>
                                      {skillSearch && (
                                        <CommandGroup>
                                          <CommandItem
                                            onSelect={() => {
                                              const newTasks = [
                                                ...suggestedTasks,
                                              ];
                                              newTasks[idx].skillName =
                                                skillSearch;
                                              setSuggestedTasks(newTasks);
                                              setSkillSearch("");
                                            }}
                                            className="text-xs cursor-pointer font-medium text-blue-600"
                                          >
                                            <Plus className="mr-2 h-3 w-3" />
                                            Use "{skillSearch}"
                                          </CommandItem>
                                        </CommandGroup>
                                      )}

                                      <CommandGroup heading="Suggested Skills">
                                        {[
                                          "Frontend",
                                          "Backend",
                                          "Design",
                                          "DevOps",
                                          "Testing",
                                        ]
                                          .filter((s) =>
                                            s
                                              .toLowerCase()
                                              .includes(
                                                skillSearch.toLowerCase()
                                              )
                                          )
                                          .map((s) => (
                                            <CommandItem
                                              key={s}
                                              onSelect={() => {
                                                const newTasks = [
                                                  ...suggestedTasks,
                                                ];
                                                newTasks[idx].skillName = s;
                                                setSuggestedTasks(newTasks);
                                                setSkillSearch("");
                                              }}
                                              className="text-xs cursor-pointer"
                                            >
                                              <Check
                                                className={cn(
                                                  "mr-2 h-3 w-3",
                                                  task.skillName === s
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                                )}
                                              />
                                              {s}
                                            </CommandItem>
                                          ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>

                              <div className="flex items-center gap-1 group/exp">
                                <Input
                                  type="number"
                                  value={task.experience}
                                  onChange={(e) => {
                                    const newTasks = [...suggestedTasks];
                                    newTasks[idx].experience =
                                      parseInt(e.target.value) || 0;
                                    setSuggestedTasks(newTasks);
                                  }}
                                  className="h-6 w-10 border-zinc-200 bg-transparent px-1 text-center text-[10px] font-bold focus-visible:ring-1 focus-visible:ring-blue-500"
                                />
                                <span className="text-[10px] font-medium text-zinc-500">
                                  exp
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 border-l border-zinc-200 pl-2 dark:border-zinc-800">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1.5">
                                      <CalendarIcon className="h-3 w-3 text-zinc-400" />
                                      <input
                                        type="date"
                                        value={task.startDate || ""}
                                        onChange={(e) => {
                                          const newTasks = [...suggestedTasks];
                                          newTasks[idx].startDate =
                                            e.target.value;
                                          setSuggestedTasks(newTasks);
                                        }}
                                        className="bg-transparent text-[10px] font-medium text-zinc-600 focus:outline-none dark:text-zinc-400"
                                      />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="text-[10px]">
                                    Start Date
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <span className="text-zinc-300">→</span>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="h-3 w-3 text-zinc-400" />
                                      <input
                                        type="date"
                                        value={task.dueDate || ""}
                                        onChange={(e) => {
                                          const newTasks = [...suggestedTasks];
                                          newTasks[idx].dueDate =
                                            e.target.value;
                                          setSuggestedTasks(newTasks);
                                        }}
                                        className={cn(
                                          "bg-transparent text-[10px] font-medium focus:outline-none",
                                          task.dueDate &&
                                            task.startDate &&
                                            task.dueDate < task.startDate
                                            ? "text-red-500"
                                            : "text-zinc-600 dark:text-zinc-400"
                                        )}
                                      />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="text-[10px]">
                                    Due Date
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {selectedSprintId ? (
                            <>
                              <div className="flex -space-x-1.5 mr-1">
                                {task.memberIds?.map((mId) => {
                                  const member = members.find(
                                    (m) => m.id === mId
                                  );
                                  if (!member) return null;
                                  return (
                                    <TooltipProvider key={mId}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Avatar className="h-5 w-5 border border-white dark:border-zinc-950 ring-1 ring-zinc-200 dark:ring-zinc-800">
                                            <AvatarImage src={member?.avatar} />
                                            <AvatarFallback className="text-[8px]">
                                              {member?.name.charAt(0)}
                                            </AvatarFallback>
                                          </Avatar>
                                        </TooltipTrigger>
                                        <TooltipContent className="text-[10px]">
                                          {member?.name}
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  );
                                })}
                              </div>

                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 flex gap-1.5 border-dashed border-zinc-300 hover:border-zinc-400 dark:border-zinc-700"
                                  >
                                    <UserPlus className="h-3 w-3 text-zinc-500" />
                                    <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
                                      Adjust
                                    </span>
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-[240px] p-0 shadow-2xl"
                                  align="end"
                                >
                                  <Command>
                                    <CommandInput
                                      placeholder="Search team..."
                                      className="h-8 text-xs"
                                    />
                                    <CommandList>
                                      <CommandEmpty className="text-xs p-2">
                                        No one found.
                                      </CommandEmpty>
                                      <CommandGroup>
                                        {members.map((member) => {
                                          const isSelected =
                                            task.memberIds?.includes(member.id);
                                          return (
                                            <CommandItem
                                              key={member.id}
                                              onSelect={() =>
                                                toggleMember(task.id, member.id)
                                              }
                                              className="flex items-center gap-2 cursor-pointer py-1.5"
                                            >
                                              <div
                                                className={cn(
                                                  "flex h-4 w-4 items-center justify-center rounded-sm border border-zinc-300",
                                                  isSelected
                                                    ? "bg-zinc-900 text-white"
                                                    : "opacity-50"
                                                )}
                                              >
                                                {isSelected && (
                                                  <Check className="h-2.5 w-2.5" />
                                                )}
                                              </div>
                                              <Avatar className="h-6 w-6">
                                                <AvatarImage
                                                  src={member.avatar}
                                                />
                                                <AvatarFallback className="text-[10px]">
                                                  {member.name[0]}
                                                </AvatarFallback>
                                              </Avatar>
                                              <span className="flex-1 text-xs truncate">
                                                {member.name}
                                              </span>
                                            </CommandItem>
                                          );
                                        })}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            </>
                          ) : (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800/50">
                              <Check className="h-3 w-3 text-zinc-500" />
                              <span className="text-[9px] font-bold uppercase tracking-tight text-zinc-500">
                                Personal
                              </span>
                            </div>
                          )}

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setSuggestedTasks((prev) =>
                                prev.filter((t) => t.id !== task.id)
                              )
                            }
                            className="h-7 w-7 text-zinc-400 hover:text-red-500 transition-colors ml-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* AI Reason */}
                      {task.reason && (
                        <div className="mt-1 border-t border-zinc-100 pt-2 dark:border-zinc-800">
                          <p className="text-[11px] leading-relaxed text-zinc-500 italic">
                            <Sparkles className="inline-block h-3 w-3 mr-1 text-amber-500" />
                            {task.reason}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}

                  {isThinking && (
                    <div className="flex items-center gap-3 p-2 text-[13px] text-zinc-500 font-medium">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="animate-pulse">
                        Architecting roadmap...
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter className="bg-zinc-50 p-4 border-t border-zinc-100 dark:bg-zinc-900/50 dark:border-zinc-800">
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={isStreaming}
            className="text-zinc-500 hover:text-zinc-900 hover:bg-transparent dark:hover:text-zinc-100"
          >
            Discard
          </Button>
          <Button
            onClick={async () => {
              setIsSaving(true);
              try {
                await handleImport(suggestedTasks);
                toast.success(
                  `Đã nhập ${suggestedTasks.length} công việc thành công!`
                );
              } catch (error) {
                console.error("Lỗi khi nhập task:", error);
                toast.error("Không thể lưu danh sách công việc.");
              } finally {
                setIsSaving(false);
              }
            }}
            disabled={suggestedTasks.length === 0 || isStreaming || isSaving}
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
