"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ClipboardCheck,
    Loader2,
    LayoutGrid,
    FileCode,
    ChevronRight,
    ChevronDown,
    FolderOpen,
    Search,
    Filter
} from "lucide-react";
import { useTeamMembers } from "@/hooks/useTeam";
import { useAuth } from "@/contexts/AuthContext";
import { taskService } from "@/services/taskService";
import { fileService, IFile } from "@/services/fileService";
import { projectService } from "@/services/projectService";
import { teamService } from "@/services/teamService";
import { MemberRole, Task, Project } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLists } from "@/hooks/useList";
import { TaskDetailModal } from "../taskmodal";
import { TaskApprovalItem } from "./TaskApprovalItem";
import { FileApprovalItem } from "./FileApprovalItem";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { FilePreviewDialog } from "@/components/features/documentation/file-preview-dialog";
import { Attachment, AttachmentType } from "@/types";

export function TaskApprovalModal() {
    const params = useParams();
    const teamId = params.teamId as string;
    const { user } = useAuth();
    const { data: teamMembers, isLoading: isLoadingMembers } = useTeamMembers(teamId);
    const queryClient = useQueryClient();
    const [open, setOpen] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState<"tasks" | "files">("tasks");
    const [collapsedSections, setCollapsedSections] = React.useState<Record<string, boolean>>({});

    // Fetch projects to map names
    const { data: projects = [] } = useQuery({
        queryKey: ['projects', teamId],
        queryFn: () => projectService.getProjects(teamId),
        enabled: !!teamId && open,
    });

    const projectMap = React.useMemo(() => {
        return projects.reduce((acc: Record<string, Project>, p: Project) => {
            acc[p.id || (p as any)._id] = p;
            return acc;
        }, {});
    }, [projects]);

    // Determine current user's role
    const currentUserRole = React.useMemo(() => {
        if (!user || !teamMembers) return null;
        const member = teamMembers.find((m: any) => m.userId === user.id) ||
            teamMembers.find((m: any) => m.id === user.id);
        return member ? member.role : null;
    }, [user, teamMembers]);

    const memberMap = React.useMemo(() => {
        if (!teamMembers) return {};
        return teamMembers.reduce((acc: any, member: any) => {
            acc[member.id] = member;
            if (member.userId) acc[member.userId] = member;
            return acc;
        }, {});
    }, [teamMembers]);

    const canApprove = currentUserRole === MemberRole.OWNER || currentUserRole === MemberRole.ADMIN;

    const { data: pendingTasksData, isLoading: isLoadingTasks } = useQuery({
        queryKey: ['tasks', 'approval-pending', teamId],
        queryFn: () => taskService.getTasksByTeam({
            teamId,
            approvalStatus: 'PENDING',
            limit: 100
        }),
        enabled: !!teamId && canApprove && open,
    });

    const { data: pendingFilesData, isLoading: isLoadingFiles } = useQuery({
        queryKey: ['files', 'approval-pending', teamId],
        queryFn: () => fileService.getFiles(undefined, teamId, 1, 100, null, 'PENDING'),
        enabled: !!teamId && canApprove && open,
    });

    const pendingTasks = pendingTasksData?.data || [];
    const pendingFiles = pendingFilesData?.data || [];
    const totalPending = pendingTasks.length + pendingFiles.length;

    // Grouping Helpers
    const groupItemsByProject = (items: any[]) => {
        return items.reduce((acc: Record<string, any[]>, item) => {
            const pId = item.projectId || "unassigned";
            if (!acc[pId]) acc[pId] = [];
            acc[pId].push(item);
            return acc;
        }, {});
    };

    const groupedTasks = React.useMemo(() => groupItemsByProject(pendingTasks), [pendingTasks]);
    const groupedFiles = React.useMemo(() => groupItemsByProject(pendingFiles), [pendingFiles]);

    const updateTaskMutation = useMutation({
        mutationFn: ({ taskId, status }: { taskId: string, status: 'APPROVED' | 'REJECTED' }) =>
            taskService.updateTask(taskId, { approvalStatus: status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['tasks', 'approval-pending'] });
            toast.success("Task status updated");
        },
        onError: () => {
            toast.error("Failed to update task status");
        }
    });

    const updateFileMutation = useMutation({
        mutationFn: ({ fileId, status }: { fileId: string, status: 'APPROVED' | 'REJECTED' }) =>
            fileService.updateFile(fileId, { approvalStatus: status as any }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
            queryClient.invalidateQueries({ queryKey: ['files', 'approval-pending'] });
            toast.success("File status updated");
        },
        onError: () => {
            toast.error("Failed to update file status");
        }
    });

    const [isProcessingBulk, setIsProcessingBulk] = React.useState(false);

    const handleBulkUpdateStatus = async (type: 'tasks' | 'files', status: 'APPROVED' | 'REJECTED') => {
        setIsProcessingBulk(true);
        try {
            if (type === 'tasks') {
                await Promise.all(pendingTasks.map((t: Task) => taskService.updateTask(t.id, { approvalStatus: status })));
                queryClient.invalidateQueries({ queryKey: ['tasks'] });
            } else {
                const fileIds = pendingFiles.map((f: IFile) => f._id);
                await fileService.updateApprovalStatusBulk(fileIds, status, teamId);
                queryClient.invalidateQueries({ queryKey: ['files'] });
            }
            toast.success(`All ${type} ${status === 'APPROVED' ? 'approved' : 'rejected'}`);
        } catch (error) {
            toast.error(`Failed to bulk update ${type}`);
        } finally {
            setIsProcessingBulk(false);
            queryClient.invalidateQueries({ queryKey: [type, 'approval-pending', teamId] });
        }
    };

    const toggleSection = (id: string) => {
        setCollapsedSections(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);

    // Fetch lists needed for TaskDetailModal
    const { lists } = useLists(pendingTasks[0]?.projectId);

    // Fetch team to get its name
    const { data: team } = useQuery({
        queryKey: ['team', teamId],
        queryFn: () => teamService.getTeam(teamId),
        enabled: !!teamId && open,
    });

    const activeTeamName = team?.name || "Team Library";

    // --- PREVIEW LOGIC ---
    const [previewFile, setPreviewFile] = React.useState<Attachment | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);

    const handlePreviewFile = async (file: IFile) => {
        try {
            const { viewUrl } = await fileService.getPreviewUrl(file._id, file.projectId || undefined, teamId);
            
            // Map IFile to Attachment type for the dialog
            const attachment: Attachment = {
                id: file._id,
                name: file.originalName,
                fileName: file.originalName,
                fileUrl: viewUrl,
                fileSize: file.size,
                mimeType: file.mimetype,
                fileType: file.type as any, // Cast to AttachmentType
                uploadedById: file.userId || "",
                uploadedAt: file.createdAt || new Date().toISOString(),
                visibility: file.visibility,
                allowedUserIds: file.allowedUserIds,
                approvalStatus: file.approvalStatus as any,
                taskId: "" // No task associated directly here
            };

            setPreviewFile(attachment);
            setIsPreviewOpen(true);
        } catch (error) {
            toast.error("Failed to get preview URL");
        }
    };

    if (isLoadingMembers) return null;

    if (!canApprove) return null;

    // Shared Height for Container
    const SHARED_HEIGHT = "600px";

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="icon" className="group relative text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all border-border/50">
                                    <ClipboardCheck className="h-5 w-5 transition-transform group-hover:scale-110" />
                                    {totalPending > 0 && (
                                        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 animate-pulse border-2 border-background" />
                                    )}
                                </Button>
                            </DialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Verification Center</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <DialogContent className="sm:max-w-[750px] max-h-[90vh] flex flex-col p-0 overflow-hidden gap-0 border-none bg-background">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle className="text-xl font-bold tracking-tight">Verification Center</DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground leading-normal">
                             Manage pending approvals for current team.
                         </DialogDescription>
                    </DialogHeader>

                    <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="flex-1 flex flex-col min-h-0">
                        <div className="px-6 py-2 border-b bg-muted/5">
                            <TabsList className="h-9 p-1 bg-muted/30 rounded-md w-fit">
                                <TabsTrigger value="tasks" className="h-7 px-4 relative data-[state=active]:bg-background data-[state=active]:shadow-none rounded-sm transition-all gap-2 text-xs">
                                    <LayoutGrid className="w-3.5 h-3.5" />
                                    Tasks
                                    {pendingTasks.length > 0 && (
                                        <Badge variant="secondary" className="ml-1 px-1 py-0 min-w-[18px] h-4 justify-center text-[10px]">
                                            {pendingTasks.length}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="files" className="h-7 px-4 relative data-[state=active]:bg-background data-[state=active]:shadow-none rounded-sm transition-all gap-2 text-xs">
                                    <FileCode className="w-3.5 h-3.5" />
                                    Files
                                    {pendingFiles.length > 0 && (
                                        <Badge variant="secondary" className="ml-1 px-1 py-0 min-w-[18px] h-4 justify-center text-[10px]">
                                            {pendingFiles.length}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div 
                            className="flex-1 flex flex-col overflow-hidden" 
                            style={{ height: SHARED_HEIGHT, maxHeight: SHARED_HEIGHT, minHeight: SHARED_HEIGHT }}
                        >
                            <TabsContent value="tasks" className="flex-1 m-0 focus-visible:outline-none flex flex-col h-full overflow-hidden">
                                <div className="p-3 px-6 border-b flex items-center justify-between bg-background">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{pendingTasks.length} Pending Tasks</span>
                                    </div>
                                    {pendingTasks.length > 0 && (
                                        <div className="flex gap-2">
                                            <Button 
                                                variant="outline" size="sm" 
                                                className="h-7 text-[10px] bg-destructive/5 text-destructive border-destructive/10 hover:bg-destructive hover:text-white transition-all shadow-none"
                                                onClick={() => handleBulkUpdateStatus('tasks', 'REJECTED')}
                                                disabled={isProcessingBulk}
                                            >
                                                Reject All
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                className="h-7 text-[10px] shadow-none"
                                                onClick={() => handleBulkUpdateStatus('tasks', 'APPROVED')}
                                                disabled={isProcessingBulk}
                                            >
                                                Approve All
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
                                    {isLoadingTasks ? (
                                        <div className="flex flex-col items-center justify-center h-full gap-3 py-20">
                                            <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
                                            <p className="text-xs text-muted-foreground animate-pulse">Fetching tasks...</p>
                                        </div>
                                    ) : pendingTasks.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-center space-y-2 py-20">
                                            <ClipboardCheck className="w-10 h-10 text-muted-foreground/20" />
                                            <p className="text-xs text-muted-foreground font-medium">All clear! No pending tasks.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 pb-6">
                                            {Object.keys(groupedTasks).map(pId => (
                                                <div key={pId} className="border border-border/40 rounded-lg overflow-hidden bg-muted/5">
                                                    <div 
                                                        onClick={() => toggleSection(`task-${pId}`)}
                                                        className="flex items-center justify-between p-2 px-3 bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {collapsedSections[`task-${pId}`] ? <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                                                            <FolderOpen className="w-3.5 h-3.5 text-primary/60" />
                                                             <span className="text-xs font-bold truncate max-w-[400px] leading-normal">
                                                                 {projectMap[pId]?.name || (pId === 'unassigned' ? `General / ${activeTeamName}` : 'Unknown Project')}
                                                             </span>
                                                            <Badge variant="outline" className="text-[9px] h-4 px-1.5 py-0 border-muted-foreground/20 text-muted-foreground bg-transparent">
                                                                {groupedTasks[pId].length}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    
                                                    {!collapsedSections[`task-${pId}`] && (
                                                        <div className="p-3 space-y-3 bg-background/40">
                                                            {groupedTasks[pId].map((task: Task) => (
                                                                <div key={task.id} onClick={() => setSelectedTask(task)} className="transform transition-all active:scale-[0.99]">
                                                                    <TaskApprovalItem
                                                                        task={task}
                                                                        memberMap={memberMap}
                                                                        onApprove={(e) => { e.stopPropagation(); updateTaskMutation.mutate({ taskId: task.id, status: 'APPROVED' }); }}
                                                                        onReject={(e) => { e.stopPropagation(); updateTaskMutation.mutate({ taskId: task.id, status: 'REJECTED' }); }}
                                                                        isUpdating={updateTaskMutation.isPending}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="files" className="flex-1 m-0 focus-visible:outline-none flex flex-col h-full overflow-hidden">
                                <div className="p-3 px-6 border-b flex items-center justify-between bg-background">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{pendingFiles.length} Pending Files</span>
                                    </div>
                                    {pendingFiles.length > 0 && (
                                        <div className="flex gap-2">
                                            <Button 
                                                variant="outline" size="sm" 
                                                className="h-7 text-[10px] bg-destructive/5 text-destructive border-destructive/10 hover:bg-destructive hover:text-white transition-all shadow-none"
                                                onClick={() => handleBulkUpdateStatus('files', 'REJECTED')}
                                                disabled={isProcessingBulk}
                                            >
                                                Reject All
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                className="h-7 text-[10px] shadow-none"
                                                onClick={() => handleBulkUpdateStatus('files', 'APPROVED')}
                                                disabled={isProcessingBulk}
                                            >
                                                Approve All
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
                                    {isLoadingFiles ? (
                                        <div className="flex flex-col items-center justify-center h-full gap-3 py-20">
                                            <Loader2 className="w-8 h-8 animate-spin text-blue-400/40" />
                                            <p className="text-xs text-muted-foreground animate-pulse">Syncing files...</p>
                                        </div>
                                    ) : pendingFiles.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-center space-y-2 py-20">
                                            <FileCode className="w-10 h-10 text-muted-foreground/20" />
                                            <p className="text-xs text-muted-foreground font-medium">No files needing approval.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 pb-6">
                                            {Object.keys(groupedFiles).map(pId => (
                                                <div key={pId} className="border border-border/40 rounded-lg overflow-hidden bg-muted/5">
                                                    <div 
                                                        onClick={() => toggleSection(`file-${pId}`)}
                                                        className="flex items-center justify-between p-2 px-3 bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {collapsedSections[`file-${pId}`] ? <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                                                            <FolderOpen className="w-3.5 h-3.5 text-blue-500/60" />
                                                             <span className="text-xs font-bold truncate max-w-[400px] leading-normal">
                                                                 {projectMap[pId]?.name || (pId === 'unassigned' ? activeTeamName : 'Unknown Folder')}
                                                             </span>
                                                            <Badge variant="outline" className="text-[9px] h-4 px-1.5 py-0 border-muted-foreground/20 text-muted-foreground bg-transparent">
                                                                {groupedFiles[pId].length}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    
                                                    {!collapsedSections[`file-${pId}`] && (
                                                        <div className="p-3 space-y-3 bg-background/40">
                                                            {groupedFiles[pId].map((file: IFile) => (
                                                                <FileApprovalItem
                                                                    key={file._id}
                                                                    file={file}
                                                                    memberMap={memberMap}
                                                                    onApprove={(e) => { e.stopPropagation(); updateFileMutation.mutate({ fileId: file._id, status: 'APPROVED' }); }}
                                                                    onReject={(e) => { e.stopPropagation(); updateFileMutation.mutate({ fileId: file._id, status: 'REJECTED' }); }}
                                                                    onPreview={handlePreviewFile}
                                                                    isUpdating={updateFileMutation.isPending}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </DialogContent>
            </Dialog>

            <FilePreviewDialog 
                isOpen={isPreviewOpen}
                onOpenChange={setIsPreviewOpen}
                file={previewFile}
            />

            {selectedTask && (
                <TaskDetailModal
                    task={selectedTask}
                    open={!!selectedTask}
                    onOpenChange={(open) => !open && setSelectedTask(null)}
                    lists={lists || []}

                    onListChange={(taskId, listId) => taskService.updateTask(taskId, { listId }).then(() => queryClient.invalidateQueries({ queryKey: ['tasks'] }))}
                    onDateChange={(taskId, newDate) => taskService.updateTask(taskId, { dueDate: newDate?.toISOString() }).then(() => queryClient.invalidateQueries({ queryKey: ['tasks'] }))}
                    onPriorityChange={(taskId, priority) => taskService.updateTask(taskId, { priority }).then(() => queryClient.invalidateQueries({ queryKey: ['tasks'] }))}
                    onAssigneeChange={(taskId, assigneeIds) => taskService.updateTask(taskId, { assigneeIds }).then(() => queryClient.invalidateQueries({ queryKey: ['tasks'] }))}
                    onTitleChange={(taskId, col, val) => taskService.updateTask(taskId, { title: val }).then(() => queryClient.invalidateQueries({ queryKey: ['tasks'] }))}
                    onDescriptionChange={(taskId, desc) => taskService.updateTask(taskId, { description: desc }).then(() => queryClient.invalidateQueries({ queryKey: ['tasks'] }))}
                    onLabelsChange={(taskId, labelIds) => taskService.updateTask(taskId, { labelIds }).then(() => queryClient.invalidateQueries({ queryKey: ['tasks'] }))}
                    updateTask={(taskId, updates) => taskService.updateTask(taskId, updates)}
                />
            )}
        </>
    );
}
