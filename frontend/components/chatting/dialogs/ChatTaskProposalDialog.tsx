"use client";

import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    Bot,
    Check,
    Loader2,
    ListTodo,
    FolderOpen
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateTaskDto, taskService } from "@/services/taskService";
import { useTeamMembers } from "@/hooks/useTeam";
import { ListCategoryEnum, Priority, SprintStatus } from "@/types";
import { useLists } from "@/hooks/useList";
import { useSprints } from "@/hooks/useSprints";
import { useProjects } from "@/hooks/useProjects";

import { SuggestionSummary } from "../../features/backlogs/task/ai-suggestion/SuggestionSummary";
import { AiTaskList } from "../../features/backlogs/task/ai-suggestion/AiTaskList";
import { SuggestedTask } from "../../features/backlogs/task/ai-suggestion/AiTaskItem";

interface ChatTaskProposalDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialTasks: SuggestedTask[];
    teamId: string;
    defaultProjectId?: string;
    summary?: string;
}

export function ChatTaskProposalDialog({
    open,
    onOpenChange,
    initialTasks,
    teamId,
    defaultProjectId,
    summary: initialSummary
}: ChatTaskProposalDialogProps) {
    const [selectedProjectId, setSelectedProjectId] = React.useState<string>(defaultProjectId || "");
    const [selectedSprintId, setSelectedSprintId] = React.useState<string | null>(null);
    const [tasks, setTasks] = React.useState<SuggestedTask[]>([]);
    const [summary, setSummary] = React.useState(initialSummary || "Generated from chat conversation");
    const [isSaving, setIsSaving] = React.useState(false);

    const { data: members = [] } = useTeamMembers(teamId);
    const { projects } = useProjects(teamId);
    const { lists } = useLists(selectedProjectId);
    const { sprints = [] } = useSprints(selectedProjectId, teamId, [
        SprintStatus.PLANNED,
        SprintStatus.ACTIVE
    ]);

    React.useEffect(() => {
        if (open && initialTasks) {
            const mappedTasks = initialTasks.map((t: any) => ({
                ...t,
                id: t.id || Math.random().toString(36).substr(2, 9),
                memberIds: t.assigneeIds || t.memberIds || (t.assigneeId ? [t.assigneeId] : []),
                skillNames: t.skillNames || (t.skillName ? [t.skillName] : (t.skill ? [t.skill] : [])),
                experience: t.exp || t.experience || 0,
                startDate: t.startDate || "",
                dueDate: t.dueDate || "",
            }));
            setTasks(mappedTasks);
        }
    }, [open, initialTasks]);

    React.useEffect(() => {
        if (defaultProjectId) {
            setSelectedProjectId(defaultProjectId);
        } else if (!selectedProjectId && projects && projects.length > 0) {
            // Default to first project if none selected
            setSelectedProjectId(projects[0].id);
        }
    }, [defaultProjectId, projects, selectedProjectId]);

    const activeSprints = sprints.filter(s => s.status === SprintStatus.ACTIVE);
    const plannedSprints = sprints.filter(s => s.status === SprintStatus.PLANNED);

    const targetList = lists?.find(
        (l) =>
            l.category === ListCategoryEnum.TODO ||
            l.name.toLowerCase().includes("to do")
    );

    const handleUpdateTask = (taskId: string, updates: Partial<SuggestedTask>) => {
        setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
        );
    };

    const handleDeleteTask = (taskId: string) => {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
    };

    const toggleMember = (taskId: string, memberId: string) => {
        setTasks((prev) =>
            prev.map((t) => {
                if (t.id === taskId) {
                    const currentMembers = t.memberIds || [];
                    const exists = currentMembers.includes(memberId);
                    return {
                        ...t,
                        memberIds: exists
                            ? currentMembers.filter((id) => id !== memberId)
                            : [...currentMembers, memberId],
                    };
                }
                return t;
            })
        );
    };

    const handleImport = async () => {
        if (!selectedProjectId) {
            toast.error("Please select a project.");
            return;
        }
        if (!targetList) {
            toast.error("No 'To Do' list found in the selected project.");
            return;
        }

        setIsSaving(true);
        try {
            const validMemberIds = new Set(members?.map(m => m.id) || []);

            const normalizedTasks: CreateTaskDto[] = tasks.map((t) => {
                const validAssignees = (t.memberIds || []).filter(id => validMemberIds.has(id));

                return {
                    title: t.title,
                    description: t.description,
                    sprintId: selectedSprintId,
                    projectId: selectedProjectId,
                    listId: targetList.id,
                    priority: Priority.MEDIUM,
                    teamId: teamId,
                    skillNames: t.skillNames,
                    exp: t.experience,
                    reporterId: null,
                    assigneeIds: validAssignees,
                    startDate: t.startDate ? new Date(t.startDate).toISOString() : null,
                    dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : null,
                    epicId: (t as any).epicId,
                };
            });

            await taskService.createTasks(normalizedTasks, "", selectedSprintId || undefined);

            toast.success(`Successfully created ${tasks.length} tasks.`);
            onOpenChange(false);
        } catch (error) {
            console.error("Import error:", error);
            toast.error("Failed to create tasks.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-2xl">
                {/* Header */}
                <DialogHeader className="px-6 py-4 border-b border-zinc-200/50 bg-white dark:bg-zinc-950 dark:border-zinc-800 z-20">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-900/10">
                            <Bot className="h-5 w-5" />
                        </div>
                        <div className="space-y-0.5">
                            <DialogTitle className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                                Tasks from Chat
                            </DialogTitle>
                            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                                Review and import tasks extracted from the conversation.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto custom-scrollbar bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="p-6 space-y-6">

                        {/* Configuration Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide flex items-center gap-1.5">
                                    <FolderOpen className="w-3.5 h-3.5" />
                                    Target Project
                                </label>
                                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                                    <SelectTrigger className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-9">
                                        <SelectValue placeholder="Select project..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {projects?.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide flex items-center gap-1.5">
                                    <ListTodo className="w-3.5 h-3.5" />
                                    Target Sprint (Optional)
                                </label>
                                <Select value={selectedSprintId || "none"} onValueChange={(v) => setSelectedSprintId(v === "none" ? null : v)}>
                                    <SelectTrigger className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-9">
                                        <SelectValue placeholder="No Sprint (Backlog)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No Sprint (Backlog)</SelectItem>
                                        {activeSprints.length > 0 && (
                                            <>
                                                <div className="px-2 py-1.5 text-xs font-semibold text-emerald-500">Active Sprints</div>
                                                {activeSprints.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
                                            </>
                                        )}
                                        {plannedSprints.length > 0 && (
                                            <>
                                                <div className="px-2 py-1.5 text-xs font-semibold text-blue-500">Planned Sprints</div>
                                                {plannedSprints.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-5 min-h-[100px]">
                            <SuggestionSummary summary={summary} setSummary={setSummary} />

                            <AiTaskList
                                suggestedTasks={tasks}
                                isThinking={false}
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
                        onClick={() => onOpenChange(false)}
                        disabled={isSaving}
                        className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={tasks.length === 0 || isSaving || !selectedProjectId}
                        className="shadow-sm dark:shadow-none min-w-[120px] bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
                    >
                        {isSaving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Check className="mr-2 h-4 w-4" />
                        )}
                        Import {tasks.length} Tasks
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
