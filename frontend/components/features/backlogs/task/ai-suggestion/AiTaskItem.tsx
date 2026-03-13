"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    CalendarIcon,
    Check,
    Plus,
    Terminal,
    Trash2,
    UserPlus,
    Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface SuggestedTask {
    id: string;
    title: string;
    memberIds: string[];
    skillName: string;
    experience: number;
    reason: string;
    description?: string;
    startDate: string;
    dueDate: string;
    type: string;
}

interface AiTaskItemProps {
    task: SuggestedTask;
    index: number;
    members: any[];
    selectedSprintId: string | null;
    onUpdate: (taskId: string, updates: Partial<SuggestedTask>) => void;
    onDelete: (taskId: string) => void;
    onToggleMember: (taskId: string, memberId: string) => void;
}

export function AiTaskItem({
    task,
    index,
    members,
    selectedSprintId,
    onUpdate,
    onDelete,
    onToggleMember,
}: AiTaskItemProps) {
    const [skillSearch, setSkillSearch] = React.useState("");

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="group relative flex flex-col gap-3 rounded-xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-[#1A1A1C] shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-white/10 transition-all p-4"
        >
            <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(task.id)}
                    className="h-7 w-7 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-xs font-bold text-zinc-600 dark:bg-white/5 dark:text-white/50">
                    {String(index + 1)}
                </div>
                <Input
                    value={task.title}
                    onChange={(e) => onUpdate(task.id, { title: e.target.value })}
                    className="h-8 w-full border-none bg-transparent p-0 text-base font-semibold text-zinc-900 placeholder:text-zinc-400 focus-visible:ring-0 dark:text-white/90 shadow-none leading-tight"
                    placeholder="Describe the task..."
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 px-1">
                <div className="flex items-center gap-2 group/field">
                    <div className="flex items-center gap-2 w-20 shrink-0 text-zinc-400 dark:text-white/60 text-xs font-medium">
                        <Terminal className="h-3.5 w-3.5 text-zinc-400 dark:text-white/40" />
                        Skill
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                        <Popover>
                            <PopoverTrigger asChild>
                                <button className={cn(
                                    "px-2 py-1 rounded-md text-[11px] font-medium transition-colors border border-dashed border-transparent hover:border-zinc-300 dark:hover:border-white/10",
                                    task.skillName
                                        ? "bg-zinc-100 text-zinc-700 dark:bg-white/5 dark:text-white/90"
                                        : "text-zinc-500 bg-zinc-50 dark:bg-white/5 dark:text-white/50"
                                )}>
                                    {task.skillName || "Select Skill"}
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0 shadow-xl bg-white dark:bg-[#1A1A1C] border-zinc-200 dark:border-white/10" align="start">
                                <Command shouldFilter={false} className="bg-transparent text-zinc-900 dark:text-white/90">
                                    <CommandInput placeholder="Search skills..." value={skillSearch} onValueChange={setSkillSearch} className="h-9 text-xs" />
                                    <CommandList>
                                        {skillSearch && (
                                            <CommandGroup><CommandItem onSelect={() => { onUpdate(task.id, { skillName: skillSearch }); setSkillSearch(""); }} className="text-xs cursor-pointer aria-selected:bg-zinc-100 dark:aria-selected:bg-white/10"><Plus className="mr-2 h-3 w-3" />Create "{skillSearch}"</CommandItem></CommandGroup>
                                        )}
                                        <CommandGroup heading="Popular">
                                            {["React", "Node.js", "TypeScript", "Python", "Design", "DevOps"].map(s => (
                                                <CommandItem key={s} onSelect={() => { onUpdate(task.id, { skillName: s }); setSkillSearch(""); }} className="text-xs cursor-pointer aria-selected:bg-zinc-100 dark:aria-selected:bg-white/10">
                                                    {s} {task.skillName === s && <Check className="ml-auto h-3 w-3" />}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>

                        {task.skillName && (
                            <>
                                <div className="w-px h-3 bg-zinc-200 dark:bg-white/10" />
                                <div className="flex items-center gap-1 group/xp">
                                    <input
                                        type="number"
                                        value={task.experience}
                                        onChange={(e) => onUpdate(task.id, { experience: parseInt(e.target.value) || 0 })}
                                        className="w-10 bg-transparent text-right text-[11px] font-mono focus:outline-none focus:bg-zinc-50 dark:focus:bg-white/5 dark:text-white/90 rounded px-0.5"
                                        min={0}
                                    />
                                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold group-hover/xp:text-zinc-600 transition-colors">xp</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 w-20 shrink-0 text-zinc-400 dark:text-white/60 text-xs font-medium">
                        <UserPlus className="h-3.5 w-3.5 text-zinc-400 dark:text-white/40" />
                        Assignee
                    </div>
                    <div className="flex items-center gap-1.5 flex-1 flex-wrap">
                        {task.memberIds.length > 0 && (
                            <div className="flex -space-x-2 mr-1">
                                {task.memberIds.map(mId => {
                                    const m = members.find(x => x.id === mId);
                                    if (!m) return null;
                                    return (
                                        <div key={mId} className="relative group/avatar">
                                            <Avatar className="h-6 w-6 border-2 border-white dark:border-[#1A1A1C] bg-zinc-100 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 transition-transform group-hover/avatar:-translate-y-1">
                                                <AvatarImage src={m.avatar} alt={m.name} className="object-cover" />
                                                <AvatarFallback className="text-[9px] font-bold bg-zinc-200 text-zinc-600 dark:bg-white/10 dark:text-white/50">
                                                    {m.name?.charAt(0)?.toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        <Popover>
                            <PopoverTrigger asChild>
                                <button className="h-6 w-6 rounded-full bg-zinc-50 border border-dashed border-zinc-300 dark:bg-white/5 dark:border-white/10 flex items-center justify-center text-zinc-400 dark:text-white/40 hover:text-zinc-600 dark:hover:border-white/20 transition-all shadow-sm">
                                    <Plus className="h-3 w-3" />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0 shadow-xl bg-white dark:bg-[#1A1A1C] border-zinc-200 dark:border-white/10" align="start">
                                <Command className="bg-transparent text-zinc-900 dark:text-white/90">
                                    <CommandInput placeholder="Assign to..." className="h-9 text-xs" />
                                    <CommandList>
                                        <CommandGroup>
                                            {members.map(m => (
                                                <CommandItem key={m.id} onSelect={() => onToggleMember(task.id, m.id)} className="text-xs gap-3 cursor-pointer aria-selected:bg-zinc-100 dark:aria-selected:bg-white/10">
                                                    <Avatar className="h-5 w-5">
                                                        <AvatarImage src={m.avatar} />
                                                        <AvatarFallback className="text-[8px]">{m.name?.substring(0, 2)}</AvatarFallback>
                                                    </Avatar>
                                                    <span>{m.name}</span>
                                                    {task.memberIds.includes(m.id) && <Check className="ml-auto h-3.5 w-3.5 text-emerald-500" />}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 w-20 shrink-0 text-zinc-400 dark:text-white/60 text-xs font-medium">
                        <CalendarIcon className="h-3.5 w-3.5 text-zinc-400 dark:text-white/40" />
                        Timeline
                    </div>
                    <div className="flex items-center gap-2 flex-1 bg-zinc-50 dark:bg-white/5 rounded-md px-2 py-1 w-fit border border-zinc-100 dark:border-white/5">
                        <input
                            type="date"
                            value={task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : ""}
                            onChange={(e) => onUpdate(task.id, { startDate: e.target.value })}
                            className="bg-transparent text-[11px] text-zinc-600 dark:text-white/70 focus:outline-none font-medium p-0 w-[85px] cursor-pointer"
                        />
                        <span className="text-zinc-300 text-[10px] font-light">to</span>
                        <input
                            type="date"
                            value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ""}
                            onChange={(e) => onUpdate(task.id, { dueDate: e.target.value })}
                            className="bg-transparent text-[11px] text-zinc-600 dark:text-white/70 focus:outline-none font-medium p-0 w-[85px] cursor-pointer"
                        />
                    </div>
                </div>

                {(task.reason || task.description || true) && (
                    <div className="col-span-1 sm:col-span-2 mt-2 pt-3 border-t border-zinc-100 dark:border-white/5 flex gap-3">
                        <div className="mt-0.5">
                            <Wand2 className="h-3.5 w-3.5 text-emerald-500" />
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-white/60 leading-relaxed">
                            <span className="font-semibold text-zinc-700 dark:text-white/90 mr-1">AI Suggestion:</span>
                            {task.description || task.reason || "This task matches the sprint goals and team capacity."}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
