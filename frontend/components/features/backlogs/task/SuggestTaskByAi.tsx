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
  Bot,
  BrainCircuit,
  CalendarIcon,
  Check,
  ChevronRight,
  Clock,
  Layers,
  Lightbulb,
  Loader2,
  Plus,
  Sparkles,
  Target,
  Terminal,
  Trash2,
  UserPlus,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CreateTaskDto } from "@/services/taskService";
import { useTeamMembers } from "@/hooks/useTeam";
import {
  ListCategoryEnum,
  Priority,
  SprintStatus,
} from "@/types";
import { useLists } from "@/hooks/useList";
import { useSprints } from "@/hooks/useSprints";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// --- Interfaces ---
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
  const [selectedSprintId, setSelectedSprintId] = React.useState<string | null>(null);
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [isThinking, setIsThinking] = React.useState(false);
  const [suggestedTasks, setSuggestedTasks] = React.useState<SuggestedTask[]>([]);
  const [skillSearch, setSkillSearch] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [summary, setSummary] = React.useState("");

  const param = useParams();
  const teamId = param?.teamId as string;
  const projectId = param?.projectId as string;
  const { data: members = [] } = useTeamMembers(teamId);
  const { lists } = useLists(projectId);
  const { sprints = [] } = useSprints(projectId, teamId, [
    SprintStatus.ACTIVE,
    SprintStatus.PLANNED,
    SprintStatus.ARCHIVED,
  ]);

  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new tasks arrive
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [suggestedTasks]);

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-zinc-50/50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-2xl">

        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-zinc-200/50 bg-white dark:bg-zinc-950 dark:border-zinc-800 z-20">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-700 dark:from-zinc-100 dark:to-zinc-300 text-white dark:text-zinc-900 shadow-lg shadow-zinc-900/10 dark:shadow-none">
              <Bot className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <DialogTitle className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                AI Task Architect
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Describe your goal and let AI build the roadmap.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-zinc-50/50 dark:bg-zinc-950/50">
          <div className="p-6 space-y-6">

            {/* Input Section */}
            <div className="relative group rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all focus-within:ring-2 focus-within:ring-zinc-900/5 dark:focus-within:ring-zinc-100/5 focus-within:border-zinc-900 dark:focus-within:border-zinc-100">
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What do you want to build? (e.g., 'Create a login page with JWT auth')"
                className="min-h-[100px] w-full resize-none border-none bg-transparent p-4 text-sm placeholder:text-zinc-400 focus-visible:ring-0"
              />

              <div className="flex items-center justify-between p-2 border-t border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-b-2xl">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800">
                      <Layers className="h-3.5 w-3.5" />
                      {selectedSprintId
                        ? sprints.find((s) => s.id === selectedSprintId)?.title
                        : "Select Sprint"}
                      <ChevronRight className="h-3 w-3 opacity-50 rotate-90" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[240px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search sprint..." />
                      <CommandList>
                        <CommandEmpty>No sprint found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem onSelect={() => setSelectedSprintId(null)} className="cursor-pointer text-xs">
                            <Layers className="mr-2 h-3.5 w-3.5 opacity-50" />
                            No Sprint (Backlog)
                            {selectedSprintId === null && <Check className="ml-auto h-3 w-3" />}
                          </CommandItem>
                          {sprints.map((sprint) => (
                            <CommandItem
                              key={sprint.id}
                              onSelect={() => setSelectedSprintId(sprint.id)}
                              className="cursor-pointer text-xs"
                            >
                              <div className="h-1.5 w-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100 mr-2" />
                              {sprint.title}
                              {selectedSprintId === sprint.id && <Check className="ml-auto h-3 w-3" />}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                <Button
                  onClick={handleAiSuggest}
                  disabled={isStreaming || !query.trim()}
                  size="sm"
                  className={cn(
                    "h-8 px-4 rounded-lg transition-all duration-300 font-medium text-xs",
                    isStreaming
                      ? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500"
                      : "bg-zinc-900 text-white hover:bg-zinc-950 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm"
                  )}
                >
                  {isStreaming ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-2" />
                      Architecting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 mr-2" />
                      Generate Plan
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Generated Content Area */}
            <div ref={scrollRef} className="space-y-5 min-h-[100px]">

              {/* Summary Banner */}
              <AnimatePresence>
                {summary && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="relative overflow-hidden rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm"
                  >
                    <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-zinc-900 to-zinc-400 dark:from-zinc-100 dark:to-zinc-600" />
                    <div className="flex flex-col gap-2 pl-2">
                      <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                        <Target className="h-4 w-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Identified Objective</span>
                      </div>
                      <Input
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        className="h-auto p-0 border-none text-base font-semibold shadow-none focus-visible:ring-0 bg-transparent"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Task List */}
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {suggestedTasks.map((task, idx) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.98, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      key={task.id}
                      className="group relative flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all hover:shadow-md hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      {/* Top Row: Index + Title + Delete */}
                      <div className="flex items-start gap-3">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-[10px] font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                          {String(idx + 1).padStart(2, '0')}
                        </div>

                        <div className="flex-1">
                          <Input
                            value={task.title}
                            onChange={(e) => {
                              const newTasks = [...suggestedTasks];
                              newTasks[idx].title = e.target.value;
                              setSuggestedTasks(newTasks);
                            }}
                            className="h-7 w-full border-none bg-transparent p-0 text-sm font-semibold text-zinc-900 placeholder:text-zinc-300 focus-visible:ring-0 dark:text-zinc-100 shadow-none"
                            placeholder="Task Title"
                          />
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSuggestedTasks(prev => prev.filter(t => t.id !== task.id))}
                          className="h-6 w-6 text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 -mr-2 -mt-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {/* Middle Row: Metadata Pills */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Skill Pill */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="flex items-center gap-1.5 rounded-md bg-blue-50/50 px-2 py-1 text-[11px] font-medium text-blue-700 hover:bg-blue-100 transition-colors dark:bg-blue-900/20 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50">
                              <Terminal className="h-3 w-3" />
                              {task.skillName || "Assign Skill"}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[200px] p-0" align="start">
                            <Command shouldFilter={false}>
                              <CommandInput
                                placeholder="Skill..."
                                value={skillSearch}
                                onValueChange={setSkillSearch}
                                className="h-8 text-xs"
                              />
                              <CommandList>
                                {skillSearch && (
                                  <CommandGroup>
                                    <CommandItem
                                      onSelect={() => {
                                        const newTasks = [...suggestedTasks];
                                        newTasks[idx].skillName = skillSearch;
                                        setSuggestedTasks(newTasks);
                                        setSkillSearch("");
                                      }}
                                      className="text-xs text-blue-600"
                                    >
                                      <Plus className="mr-2 h-3 w-3" />
                                      Use "{skillSearch}"
                                    </CommandItem>
                                  </CommandGroup>
                                )}
                                <CommandGroup heading="Suggestions">
                                  {["Frontend", "Backend", "Design", "DevOps", "Testing"]
                                    .filter(s => s.toLowerCase().includes(skillSearch.toLowerCase()))
                                    .map(s => (
                                      <CommandItem
                                        key={s}
                                        onSelect={() => {
                                          const newTasks = [...suggestedTasks];
                                          newTasks[idx].skillName = s;
                                          setSuggestedTasks(newTasks);
                                          setSkillSearch("");
                                        }}
                                        className="text-xs"
                                      >
                                        <Check className={cn("mr-2 h-3 w-3", task.skillName === s ? "opacity-100" : "opacity-0")} />
                                        {s}
                                      </CommandItem>
                                    ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>

                        <div className="h-3 w-px bg-zinc-200 dark:bg-zinc-800" />

                        {/* Exp Input */}
                        <div className="flex items-center gap-1 group/exp relative">
                          <Input
                            type="number"
                            value={task.experience}
                            onChange={(e) => {
                              const newTasks = [...suggestedTasks];
                              newTasks[idx].experience = parseInt(e.target.value) || 0;
                              setSuggestedTasks(newTasks);
                            }}
                            className="h-6 w-8 border-none bg-transparent p-0 text-center text-[11px] font-bold hover:bg-zinc-100 rounded focus:bg-white focus:ring-1 focus:ring-zinc-200 transition-all appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="text-[10px] text-zinc-400 font-medium">exp</span>
                        </div>

                        <div className="h-3 w-px bg-zinc-200 dark:bg-zinc-800" />

                        {/* Date Inputs */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 rounded bg-zinc-50 px-1.5 py-0.5 border border-transparent hover:border-zinc-200 transition-colors dark:bg-zinc-900">
                            <CalendarIcon className="h-3 w-3 text-zinc-400" />
                            <input
                              type="date"
                              value={task.startDate || ""}
                              onChange={(e) => {
                                const newTasks = [...suggestedTasks];
                                newTasks[idx].startDate = e.target.value;
                                setSuggestedTasks(newTasks);
                              }}
                              className="bg-transparent text-[10px] font-medium text-zinc-600 focus:outline-none dark:text-zinc-400 w-[70px]"
                            />
                          </div>
                          <span className="text-zinc-300 text-[10px]">to</span>
                          <div className="flex items-center gap-1.5 rounded bg-zinc-50 px-1.5 py-0.5 border border-transparent hover:border-zinc-200 transition-colors dark:bg-zinc-900">
                            <Clock className="h-3 w-3 text-zinc-400" />
                            <input
                              type="date"
                              value={task.dueDate || ""}
                              onChange={(e) => {
                                const newTasks = [...suggestedTasks];
                                newTasks[idx].dueDate = e.target.value;
                                setSuggestedTasks(newTasks);
                              }}
                              className={cn(
                                "bg-transparent text-[10px] font-medium focus:outline-none w-[70px]",
                                task.dueDate && task.startDate && task.dueDate < task.startDate
                                  ? "text-red-500"
                                  : "text-zinc-600 dark:text-zinc-400"
                              )}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Footer: Reason & Members */}
                      <div className="mt-1 flex items-start justify-between gap-4">
                        {/* Reason Box */}
                        <div className="flex-1 rounded-md bg-amber-50/50 p-2 text-[11px] leading-relaxed text-amber-700/80 dark:bg-amber-900/10 dark:text-amber-500/80 border border-amber-100/50 dark:border-amber-900/20">
                          <Wand2 className="mb-1 h-3 w-3 opacity-70" />
                          {task.reason}
                        </div>

                        {/* Members */}
                        <div className="shrink-0 flex items-center pt-1">
                          {selectedSprintId ? (
                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-2">
                                {task.memberIds?.map((mId) => {
                                  const member = members.find((m) => m.id === mId);
                                  if (!member) return null;
                                  return (
                                    <TooltipProvider key={mId}>
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <Avatar className="h-6 w-6 border-2 border-white dark:border-zinc-900 ring-1 ring-zinc-200 dark:ring-zinc-800">
                                            <AvatarImage src={member?.avatar} />
                                            <AvatarFallback className="text-[8px] bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">{member?.name.charAt(0)}</AvatarFallback>
                                          </Avatar>
                                        </TooltipTrigger>
                                        <TooltipContent>{member?.name}</TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  );
                                })}
                              </div>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full border border-dashed border-zinc-300 hover:border-zinc-400 text-zinc-400 hover:text-zinc-600">
                                    <UserPlus className="h-3 w-3" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[200px] p-0" align="end">
                                  <Command>
                                    <CommandInput placeholder="Assign member..." className="h-8 text-xs" />
                                    <CommandList>
                                      <CommandGroup>
                                        {members.map(member => {
                                          const isSelected = task.memberIds?.includes(member.id);
                                          return (
                                            <CommandItem
                                              key={member.id}
                                              onSelect={() => toggleMember(task.id, member.id)}
                                              className="text-xs cursor-pointer"
                                            >
                                              <div className={cn("mr-2 flex h-3 w-3 items-center justify-center rounded border", isSelected ? "bg-zinc-900 border-zinc-900 dark:bg-zinc-100 dark:border-zinc-100 text-white dark:text-zinc-900" : "border-zinc-300 dark:border-zinc-700")}>
                                                {isSelected && <Check className="h-2 w-2" />}
                                              </div>
                                              <Avatar className="h-5 w-5 mr-2">
                                                <AvatarImage src={member.avatar} />
                                                <AvatarFallback>{member.name[0]}</AvatarFallback>
                                              </Avatar>
                                              {member.name}
                                            </CommandItem>
                                          )
                                        })}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
                              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Backlog</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Loading Skeleton */}
                {isThinking && (
                  <div className="rounded-xl border border-dashed border-zinc-200 p-6 flex flex-col items-center justify-center gap-3 bg-zinc-50/50 dark:border-zinc-800">
                    <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                    <p className="text-xs text-zinc-400 animate-pulse font-medium">Processing requirements...</p>
                  </div>
                )}

                {/* Empty State */}
                {!isThinking && suggestedTasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-center opacity-40">
                    <Lightbulb className="h-8 w-8 text-zinc-400 mb-2" />
                    <p className="text-sm font-medium text-zinc-500">Awaiting your command</p>
                  </div>
                )}
              </div>
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
                toast.success(`Successfully imported ${suggestedTasks.length} tasks.`);
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