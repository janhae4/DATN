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
  Check,
  Loader2,
  Sparkles,
  Terminal,
  Trash2,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Mock Members Data
const MOCK_MEMBERS = [
  { id: "dev-1", name: "Alex Nguyen", avatar: "https://github.com/shadcn.png" },
  { id: "dev-2", name: "Sarah Tran", avatar: "" },
  { id: "des-1", name: "Justin Lee", avatar: "" },
  { id: "lead-1", name: "Hana Pham", avatar: "" },
];

interface SuggestedTask {
  id: string;
  title: string;
  assigneeIds: string[];
}

interface SuggestTaskByAiProps {
  children: React.ReactNode;
  onSave?: (tasks: SuggestedTask[]) => void;
}

export function SuggestTaskByAi({ children, onSave }: SuggestTaskByAiProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [isThinking, setIsThinking] = React.useState(false);
  const [suggestedTasks, setSuggestedTasks] = React.useState<SuggestedTask[]>(
    []
  );

  const scrollRef = React.useRef<HTMLDivElement>(null);

  const handleAiSuggest = async () => {
    if (!query.trim()) {
      toast.error("Please enter a description");
      return;
    }

    setIsStreaming(true);
    setIsThinking(true);
    setSuggestedTasks([]);

    // Giả lập dữ liệu AI trả về: "Tên task | ID người thực hiện"
    const mockResponse = [
      { title: "Nghiên cứu thị trường và đối thủ", memberId: "lead-1" },
      { title: "Thiết kế Wireframe cho các trang chính", memberId: "des-1" },
      { title: "Lập trình giao diện Front-end cơ bản", memberId: "dev-1" },
      { title: "Tối ưu hóa trải nghiệm người dùng", memberId: "dev-2" },
    ];

    try {
      await new Promise((r) => setTimeout(r, 1500));
      setIsThinking(false);

      for (let i = 0; i < mockResponse.length; i++) {
        await new Promise((r) => setTimeout(r, 150));
        setSuggestedTasks((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}-${i}`,
            title: mockResponse[i].title,
            assigneeIds: [mockResponse[i].memberId],
          },
        ]);
      }
      toast.success("AI đã gợi ý xong!");
    } catch (error) {
      toast.error("Failed to get AI suggestions.");
    } finally {
      setIsStreaming(false);
    }
  };

  const toggleMember = (taskId: string, memberId: string) => {
    setSuggestedTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const exists = t.assigneeIds.includes(memberId);
          return {
            ...t,
            assigneeIds: exists
              ? t.assigneeIds.filter((id) => id !== memberId)
              : [...t.assigneeIds, memberId],
          };
        }
        return t;
      })
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] overflow-hidden border border-zinc-200 bg-white p-0 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <DialogHeader className="p-6 pb-0">
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

        <div className="space-y-6 p-6">
          {/* Input Area */}
          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              Objective
            </Label>
            <div className="relative group">
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Launch a new SaaS product in 30 days..."
                className="min-h-[110px] bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900 resize-none transition-all dark:bg-zinc-900/50 dark:border-zinc-800"
              />
              <Button
                onClick={handleAiSuggest}
                disabled={isStreaming || !query.trim()}
                className={cn(
                  "absolute bottom-2 right-2 h-8 transition-all font-medium",
                  isStreaming
                    ? "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
                    : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                )}
                size="sm"
              >
                {isStreaming ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 mr-2" />
                )}
                {isStreaming ? "Processing" : "Generate"}
              </Button>
            </div>
          </div>

          {/* Results Area */}
          <div
            ref={scrollRef}
            className="min-h-[160px] max-h-[280px] overflow-y-auto rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 transition-all dark:border-zinc-800 dark:bg-zinc-900/30"
          >
            {suggestedTasks.length === 0 && !isThinking ? (
              <div className="h-[128px] flex flex-col items-center justify-center text-zinc-400 gap-3 border-2 border-dashed border-zinc-200 rounded-lg dark:border-zinc-800">
                <BrainCircuit className="h-6 w-6 opacity-20" />
                <p className="text-[13px] font-medium">
                  No tasks generated yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {suggestedTasks.map((task, idx) => (
                  <div
                    key={task.id}
                    className="group flex items-center gap-3 animate-in fade-in slide-in-from-bottom-1 duration-300"
                  >
                    {/* Số thứ tự */}
                    <div className="flex-none h-6 w-6 rounded border border-zinc-200 bg-white text-zinc-900 flex items-center justify-center text-[10px] font-bold dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
                      {idx + 1}
                    </div>

                    {/* Tiêu đề Task */}
                    <Input
                      value={task.title}
                      onChange={(e) => {
                        const newTasks = [...suggestedTasks];
                        newTasks[idx].title = e.target.value;
                        setSuggestedTasks(newTasks);
                      }}
                      className="h-8 border-none bg-transparent p-0 text-[14px] focus-visible:ring-0 placeholder:text-zinc-300 flex-1"
                    />

                    {/* Assignee Selector & Tooltip */}
                    <div className="flex items-center gap-1">
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex -space-x-1.5 overflow-hidden cursor-help">
                              {/* Hiển thị tối đa 2 Avatar đầu tiên */}
                              {task.assigneeIds.slice(0, 2).map((id) => {
                                const m = MOCK_MEMBERS.find(
                                  (mem) => mem.id === id
                                );
                                return (
                                  <Avatar
                                    key={id}
                                    className="h-6 w-6 border-2 border-white dark:border-zinc-950"
                                  >
                                    <AvatarImage src={m?.avatar} />
                                    <AvatarFallback className="text-[8px] bg-zinc-100 uppercase">
                                      {m?.name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                );
                              })}

                              {/* Badge +N nếu còn dư người */}
                              {task.assigneeIds.length > 2 && (
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 border-2 border-white text-[9px] font-bold text-zinc-600 dark:bg-zinc-800 dark:border-zinc-950 dark:text-zinc-400">
                                  +{task.assigneeIds.length - 2}
                                </div>
                              )}
                            </div>
                          </TooltipTrigger>

                          {/* Nội dung Tooltip: Hiện toàn bộ danh sách tên */}
                          <TooltipContent
                            side="top"
                            className="p-2 bg-zinc-900 text-white border-zinc-800"
                          >
                            <div className="text-[11px] space-y-1">
                              <p className="font-bold border-b border-zinc-700 pb-1 mb-1">
                                Assignees:
                              </p>
                              {task.assigneeIds.map((id) => {
                                const m = MOCK_MEMBERS.find(
                                  (mem) => mem.id === id
                                );
                                return (
                                  <div key={id}>{m?.name || "Unknown"}</div>
                                );
                              })}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      {/* Nút thêm Assignee */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800"
                          >
                            <UserPlus className="h-3.5 w-3.5 text-zinc-500" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-[200px] p-0 shadow-2xl"
                          align="end"
                        >
                          <Command>
                            <CommandInput
                              placeholder="Search member..."
                              className="h-8 text-xs"
                            />
                            <CommandList>
                              <CommandEmpty className="p-2 text-xs">
                                No results found.
                              </CommandEmpty>
                              <CommandGroup>
                                {MOCK_MEMBERS.map((member) => (
                                  <CommandItem
                                    key={member.id}
                                    onSelect={() =>
                                      toggleMember(task.id, member.id)
                                    }
                                    className="flex items-center justify-between py-1.5"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-5 w-5">
                                        <AvatarImage src={member.avatar} />
                                        <AvatarFallback className="text-[8px]">
                                          {member.name.charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-xs">
                                        {member.name}
                                      </span>
                                    </div>
                                    {task.assigneeIds.includes(member.id) && (
                                      <Check className="h-3 w-3 text-zinc-900" />
                                    )}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Nút Xóa Task */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setSuggestedTasks((prev) =>
                          prev.filter((t) => t.id !== task.id)
                        )
                      }
                      className="h-7 w-7 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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
            onClick={() => {
              onSave?.(suggestedTasks);
              setOpen(false);
              toast.success(`Imported ${suggestedTasks.length} tasks`);
            }}
            disabled={suggestedTasks.length === 0 || isStreaming}
            className="bg-zinc-900 text-white hover:bg-zinc-800 px-6 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm"
          >
            <Check className="mr-2 h-4 w-4" /> Import Tasks
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
