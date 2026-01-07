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
  Brain,
  CalendarIcon,
  Check,
  ChevronDown,
  Clock,
  Layers,
  Loader2,
  Plus,
  Sparkles,
  Terminal,
  Trash2,
  UserPlus,
  ArrowRight,
  Bot,
  GripVertical,
  Layout,
  Type,
  AlignLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CreateTaskDto } from "@/services/taskService";
import { useParams } from "next/navigation";
import { useTeamMembers } from "@/hooks/useTeam";
import {
  ListCategoryEnum,
  MemberRole,
  Priority,
  SprintStatus,
  UserSkill,
} from "@/types";
import { useLists } from "@/hooks/useList";
import { useSprints } from "@/hooks/useSprints";
import { motion, AnimatePresence } from "framer-motion";

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
  const { data: members = [] } = useTeamMembers(teamId);
  const { lists } = useLists(projectId);
  const { sprints = [] } = useSprints(projectId, teamId, [
    SprintStatus.ACTIVE,
    SprintStatus.PLANNED,
    SprintStatus.ARCHIVED,
  ]);

  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [suggestedTasks.length]);

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
                toast.success("Roadmap generated successfully");
              }
            } catch (e) {
              console.error("Parse error:", line);
            }
          });
        },
      });
    } catch (error) {
      console.log(error);
      toast.error("AI disconnected");
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
      toast.error("Missing 'To Do' list for import.");
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
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] flex flex-col overflow-hidden border border-zinc-200 bg-white p-0 shadow-xl dark:border-zinc-800 dark:bg-[#191919] sm:rounded-xl">
        
        {/* Header - Notion Style: Clean, Minimal */}
        <DialogHeader className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-[#191919] z-10 shrink-0">
          <div className="flex items-center gap-3">
             <div className="flex items-center justify-center w-8 h-8 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-default">
                <Layout className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
             </div>
             <div>
                <DialogTitle className="text-base font-semibold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                    AI Task Architect
                </DialogTitle>
             </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 custom-scrollbar bg-white dark:bg-[#191919]">
          
          {/* Controls Section */}
          <div className="flex flex-col gap-4">
             {/* Sprint Selector - Notion Property Style */}
            <div className="flex items-center gap-4 group">
                <div className="flex items-center gap-2 text-sm text-zinc-500 w-[120px] shrink-0">
                    <Layers className="w-4 h-4" />
                    <span>Sprint</span>
                </div>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        className="h-8 px-2 -ml-2 text-sm font-normal text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded flex items-center gap-2 transition-colors"
                    >
                        {selectedSprintId ? (
                             <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-1.5 py-0.5 rounded text-xs font-medium border border-blue-200 dark:border-blue-900/50">
                                {sprints.find((s) => s.id === selectedSprintId)?.title}
                             </span>
                        ) : (
                            <span className="text-zinc-400 italic">Empty</span>
                        )}
                        <ChevronDown className="w-3 h-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[280px] p-0 shadow-lg border border-zinc-200 dark:border-zinc-800" align="start">
                        <Command>
                            <CommandInput placeholder="Select sprint..." className="h-8 text-xs" />
                            <CommandList>
                                <CommandEmpty>No sprint found.</CommandEmpty>
                                <CommandGroup>
                                    <CommandItem onSelect={() => setSelectedSprintId(null)} className="cursor-pointer text-sm">
                                        <div className="w-4 h-4 mr-2 flex items-center justify-center">
                                            {!selectedSprintId && <Check className="w-3 h-3" />}
                                        </div>
                                        No Sprint
                                    </CommandItem>
                                    {sprints.map((sprint) => (
                                        <CommandItem key={sprint.id} onSelect={() => setSelectedSprintId(sprint.id)} className="cursor-pointer text-sm">
                                            <div className="w-4 h-4 mr-2 flex items-center justify-center">
                                                {selectedSprintId === sprint.id && <Check className="w-3 h-3" />}
                                            </div>
                                            {sprint.title}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>
            
            <div className="h-px w-full bg-zinc-100 dark:bg-zinc-800" />

            {/* Input - Notion Text Block Style */}
            <div className="space-y-3">
                 <div className="flex items-center gap-2 text-sm text-zinc-500 mb-1">
                    <AlignLeft className="w-4 h-4" />
                    <span>Goal</span>
                </div>
                <div className="relative group">
                    <Textarea
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Describe what you want to build..."
                        className="min-h-[100px] bg-zinc-50 dark:bg-zinc-800/30 border-none resize-none p-3 text-sm focus-visible:ring-0 placeholder:text-zinc-400 rounded-md transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                    />
                    <div className="absolute bottom-3 right-3">
                        <Button
                            onClick={handleAiSuggest}
                            disabled={isStreaming || !query.trim()}
                            size="sm"
                            className={cn(
                                "h-7 px-3 text-xs font-medium rounded shadow-sm transition-all",
                                isStreaming 
                                ? "bg-zinc-100 text-zinc-400 dark:bg-zinc-800" 
                                : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
                            )}
                        >
                            {isStreaming ? (
                                <>Thinking...</>
                            ) : (
                                <>
                                    <Sparkles className="w-3 h-3 mr-1.5" />
                                    Generate
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
          </div>

          <AnimatePresence>
            {summary && (
               <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pl-3 border-l-2 border-zinc-200 dark:border-zinc-700 py-1"
               >
                  <div className="flex items-center gap-2 mb-1">
                      <Type className="w-3 h-3 text-zinc-400" />
                      <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Objective</span>
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
                    {summary}
                  </h3>
               </motion.div>
            )}
          </AnimatePresence>

          {/* Results List - Database View Style */}
          <div className="space-y-2">
             {suggestedTasks.length > 0 && (
                 <div className="flex items-center gap-2 py-2 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="w-6 shrink-0" />
                    <div className="flex-1 text-xs font-medium text-zinc-400 uppercase tracking-wider px-2">Task Name</div>
                    <div className="w-[100px] text-xs font-medium text-zinc-400 uppercase tracking-wider">Skill & Exp</div>
                    <div className="w-[120px] text-xs font-medium text-zinc-400 uppercase tracking-wider">Timeline</div>
                    <div className="w-[80px] text-xs font-medium text-zinc-400 uppercase tracking-wider">Assignee</div>
                 </div>
             )}

            <div
              ref={scrollRef}
              className="min-h-[100px] max-h-[350px] overflow-y-auto space-y-0.5 pb-2"
            >
               <AnimatePresence mode="popLayout">
                 {suggestedTasks.length === 0 && !isThinking && (
                     <div className="py-12 flex flex-col items-center justify-center text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-800/10">
                         <Bot className="w-8 h-8 mb-2 opacity-50" />
                         <p className="text-sm">Ready to architect your project</p>
                     </div>
                 )}
                 {suggestedTasks.map((task, idx) => (
                    <motion.div
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        key={task.id}
                        className="group flex items-start gap-2 p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
                    >
                        {/* Drag Handle / ID */}
                        <div className="w-6 h-8 flex items-center justify-center shrink-0">
                           <span className="text-[10px] text-zinc-300 group-hover:hidden font-mono">{idx + 1}</span>
                           <GripVertical className="w-3.5 h-3.5 text-zinc-400 hidden group-hover:block cursor-grab" />
                        </div>

                        {/* Title Input */}
                        <div className="flex-1 min-w-0">
                             <Input
                                value={task.title}
                                onChange={(e) => {
                                    const newTasks = [...suggestedTasks];
                                    newTasks[idx].title = e.target.value;
                                    setSuggestedTasks(newTasks);
                                }}
                                className="h-8 border-none bg-transparent p-2 text-sm text-zinc-700 dark:text-zinc-200 focus-visible:ring-1 focus-visible:ring-zinc-200 dark:focus-visible:ring-zinc-700 rounded-md shadow-none"
                            />
                            {task.reason && (
                                <div className="px-2 text-[10px] text-zinc-400 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                    {task.reason}
                                </div>
                            )}
                        </div>

                        {/* Skill & Exp tag style */}
                        <div className="w-[100px] flex flex-col justify-center gap-1 shrink-0">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button className="h-6 px-1.5 flex items-center gap-1 text-[11px] bg-orange-50 text-orange-700 border border-orange-200 rounded hover:bg-orange-100 transition-colors dark:bg-orange-900/20 dark:border-orange-900/50 dark:text-orange-400 truncate max-w-full">
                                        <span className="truncate">{task.skillName || "Skill"}</span>
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[200px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Skill..." autoFocus className="h-8 text-xs"/>
                                        <CommandList>
                                            {skillSearch && <CommandItem onSelect={() => {
                                                const newTasks = [...suggestedTasks];
                                                newTasks[idx].skillName = skillSearch;
                                                setSuggestedTasks(newTasks);
                                                setSkillSearch("");
                                            }} className="text-xs">{skillSearch}</CommandItem>}
                                             {["Frontend", "Backend", "Design", "DevOps"].map(s => (
                                                  <CommandItem key={s} onSelect={() => {
                                                        const newTasks = [...suggestedTasks];
                                                        newTasks[idx].skillName = s;
                                                        setSuggestedTasks(newTasks);
                                                  }} className="text-xs">{s}</CommandItem>
                                             ))}
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            <div className="flex items-center gap-1 px-1.5">
                                 <span className="text-[9px] text-zinc-400">EXP</span>
                                 <input
                                    type="number"
                                    value={task.experience}
                                    onChange={(e) => {
                                        const newTasks = [...suggestedTasks];
                                        newTasks[idx].experience = parseInt(e.target.value) || 0;
                                        setSuggestedTasks(newTasks);
                                    }}
                                    className="w-6 bg-transparent text-[10px] border-b border-transparent focus:border-zinc-300 text-center outline-none"
                                 />
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="w-[120px] flex flex-col justify-center gap-1 shrink-0">
                             <div className="flex items-center gap-1 text-xs text-zinc-500">
                                <CalendarIcon className="w-3 h-3 opacity-50" />
                                <input
                                    type="date"
                                    value={task.startDate || ""}
                                    onChange={(e) => {
                                        const newTasks = [...suggestedTasks];
                                        newTasks[idx].startDate = e.target.value;
                                        setSuggestedTasks(newTasks);
                                    }}
                                    className="w-[75px] bg-transparent outline-none text-[10px] cursor-pointer hover:bg-zinc-100 rounded px-0.5"
                                />
                             </div>
                             <div className="flex items-center gap-1 text-xs text-zinc-500">
                                <ArrowRight className="w-3 h-3 opacity-30" />
                                <input
                                    type="date"
                                    value={task.dueDate || ""}
                                    onChange={(e) => {
                                        const newTasks = [...suggestedTasks];
                                        newTasks[idx].dueDate = e.target.value;
                                        setSuggestedTasks(newTasks);
                                    }}
                                    className={cn("w-[75px] bg-transparent outline-none text-[10px] cursor-pointer hover:bg-zinc-100 rounded px-0.5", 
                                        task.dueDate && task.startDate && task.dueDate < task.startDate ? "text-red-500" : ""
                                    )}
                                />
                             </div>
                        </div>

                        {/* Assignee */}
                        <div className="w-[80px] flex items-center justify-end gap-1 shrink-0 pr-1">
                             <div className="flex -space-x-1.5">
                                {task.memberIds?.map((mId) => {
                                    const member = members.find((m) => m.id === mId);
                                    if (!member) return null;
                                    return (
                                        <Avatar key={mId} className="w-5 h-5 border-2 border-white dark:border-zinc-900 ring-1 ring-zinc-100">
                                            <AvatarImage src={member.avatar} />
                                            <AvatarFallback className="text-[8px]">{member.name[0]}</AvatarFallback>
                                        </Avatar>
                                    );
                                })}
                             </div>
                             <Popover>
                                <PopoverTrigger asChild>
                                    <button className="flex items-center justify-center w-5 h-5 rounded hover:bg-zinc-200 text-zinc-400 transition-colors">
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[200px] p-0" align="end">
                                    <Command>
                                        <CommandInput placeholder="Assign..." className="h-8 text-xs" />
                                        <CommandList>
                                            {members.map(member => (
                                                <CommandItem key={member.id} onSelect={() => toggleMember(task.id, member.id)} className="text-xs cursor-pointer">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="w-4 h-4">
                                                            <AvatarImage src={member.avatar} />
                                                            <AvatarFallback className="text-[8px]">{member.name[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="truncate">{member.name}</span>
                                                        {task.memberIds.includes(member.id) && <Check className="w-3 h-3 ml-auto opacity-50" />}
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                             </Popover>

                             <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSuggestedTasks(prev => prev.filter(t => t.id !== task.id))}
                                className="h-6 w-6 text-zinc-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all absolute right-2"
                             >
                                <Trash2 className="w-3 h-3" />
                             </Button>
                        </div>
                    </motion.div>
                 ))}

                 {isThinking && (
                     <div className="flex items-center gap-2 px-2 py-2 text-zinc-400 text-xs">
                         <Loader2 className="w-3 h-3 animate-spin" />
                         <span>Thinking...</span>
                     </div>
                 )}
               </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 bg-white dark:bg-[#191919] border-t border-zinc-100 dark:border-zinc-800 z-10 shrink-0">
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={isStreaming}
            size="sm"
            className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 h-8 text-xs font-normal"
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              setIsSaving(true);
              try {
                await handleImport(suggestedTasks);
                toast.success(`Imported ${suggestedTasks.length} tasks`);
              } catch (error) {
                console.error(error);
                toast.error("Failed to import");
              } finally {
                setIsSaving(false);
              }
            }}
            disabled={suggestedTasks.length === 0 || isStreaming || isSaving}
            size="sm"
            className=" text-white shadow-sm h-8 text-xs font-medium px-4"
          >
            {isSaving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : "Import Tasks"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
