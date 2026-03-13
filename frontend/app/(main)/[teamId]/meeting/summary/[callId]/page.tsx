"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Video,
  Calendar,
  Clock,
  Users,
  FileText,
  PlayCircle,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Edit2,
  Trash2,
  Save,
  X,
  Trash,
  MessageSquare,
  Loader2,
  ChevronDown,
  ExternalLink,
  ListChecks,
  UserPlus,
  Check,
  CalendarIcon,
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { videoChatService } from "@/services/videoChatService";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamMembers } from "@/hooks/useTeam";
import { useCall } from "@/hooks/useCall";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { SuggestTaskByAi } from "@/components/features/backlogs/task/SuggestTaskByAi";
import { useProjects } from "@/hooks/useProjects";

interface CallParticipant {
  userId: string;
  role: string;
  joinedAt: string;
  leftAt?: string;
}

interface CallRecording {
  id: string;
  status: string;
  fileUrl?: string;
  startedAt: string;
  endedAt?: string;
  fileSizeKB?: number;
}

interface CallSummaryBlock {
  content: string;
}

interface CallActionItem {
  id: string;
  content: string;
  status: string;
  assigneeId?: string;
  startDate?: string;
  endDate?: string;
}

interface CallTranscript {
  id: string;
  userId: string;
  userName?: string;
  content: string;
  timestamp: string;
}

interface CallDetails {
  id: string;
  roomId: string;
  createdAt: string;
  endedAt?: string;
  refId?: string;
  refType?: string;
  participants: CallParticipant[];
  summary: CallSummaryBlock[];
  actionItems: {
    data: CallActionItem[];
    page: number;
    hasMore: boolean;
    loading: boolean;
  };
  transcripts: {
    data: CallTranscript[];
    page: number;
    hasMore: boolean;
    loading: boolean;
  };
  recordings: {
    data: CallRecording[];
    page: number;
    hasMore: boolean;
    loading: boolean;
  };
}

export default function SummaryPage() {
  const { teamId, callId } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const {
    call,
    isLoading,
    actionItems,
    isLoadingActionItems,
    hasNextActionItems,
    fetchNextActionItems,
    transcripts,
    isLoadingTranscripts,
    hasNextTranscripts,
    fetchNextTranscripts,
    recordings,
    isLoadingRecordings,
    hasNextRecordings,
    fetchNextRecordings,
    updateActionItem,
    deleteActionItem,
    acceptActionItem,
    createTasks,
    suggestTaskByAi,
  } = useCall(callId as string);

  const { projects } = useProjects(teamId as string);
  const projectId = call?.refType === 'PROJECT' ? call.refId : (projects?.[0]?.id || "");

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CallActionItem>>({});

  // Infinite scroll sentinels
  const { ref: actionRef, inView: actionInView } = useInView({ threshold: 0.1 });
  const { ref: transcriptRef, inView: transcriptInView } = useInView({ threshold: 0.1 });
  const { ref: mediaRef, inView: mediaInView } = useInView({ threshold: 0.1 });

  useEffect(() => {
    if (actionInView && hasNextActionItems && !isLoadingActionItems) {
      fetchNextActionItems();
    }
  }, [actionInView, hasNextActionItems, isLoadingActionItems, fetchNextActionItems]);

  useEffect(() => {
    if (transcriptInView && hasNextTranscripts && !isLoadingTranscripts) {
      fetchNextTranscripts();
    }
  }, [transcriptInView, hasNextTranscripts, isLoadingTranscripts, fetchNextTranscripts]);

  useEffect(() => {
    if (mediaInView && hasNextRecordings && !isLoadingRecordings) {
      fetchNextRecordings();
    }
  }, [mediaInView, hasNextRecordings, isLoadingRecordings, fetchNextRecordings]);

  // Team members for avatars
  const { data: teamMembers = [] } = useTeamMembers(teamId as string);

  const getDuration = (start: string, end?: string) => {
    if (!end) return "Ongoing";
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const diff = Math.floor((endTime - startTime) / 1000 / 60);
    if (diff < 1) return "< 1 min";
    return `${diff} min`;
  };

  const handleUpdateActionItem = async (itemId: string) => {
    try {
      await updateActionItem({ itemId, data: editForm });
      setEditingItemId(null);
    } catch (error) {
      // toast is handled in hook
    }
  };

  const handleAcceptSingleActionItem = async (item: CallActionItem) => {
    try {
      await acceptActionItem({ item });
    } catch (error) {
      // toast is handled in hook
    }
  };

  const getAssigneeAvatar = (assigneeId: string) => {
    const member = teamMembers.find((m: any) => m.id === assigneeId || m.userId === assigneeId);
    if (!member) return null;
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Avatar className="h-6 w-6 border border-background">
              <AvatarImage src={member.avatar} />
              <AvatarFallback className="text-[10px]">
                {(member.name || "?").charAt(0)}
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{member.name}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 max-w-6xl">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-xl bg-zinc-200 dark:bg-[#18181A] border-none" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 bg-zinc-200 dark:bg-[#18181A] border-none" />
            <Skeleton className="h-4 w-48 bg-zinc-200 dark:bg-[#18181A] border-none" />
          </div>
        </div>
        <div className="space-y-6">
          <Skeleton className="h-12 w-full rounded-xl bg-zinc-200 dark:bg-[#18181A] border-none" />
          <Skeleton className="h-64 w-full rounded-lg bg-zinc-200 dark:bg-[#18181A] border-none" />
          <Skeleton className="h-64 w-full rounded-lg bg-zinc-200 dark:bg-[#18181A] border-none" />
        </div>
      </div>
    );
  }

  if (!call) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="p-6 bg-zinc-100 dark:bg-white/5 rounded-full border-2 border-dashed border-zinc-200 dark:border-white/10">
          <Video className="h-12 w-12 text-zinc-400 dark:text-white/20" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white/90">Meeting Not Found</h2>
        <p className="text-zinc-500 dark:text-white/50 text-center max-w-sm">
          The meeting archive you are looking for does not exist or has been removed.
        </p>
        <Button onClick={() => router.back()} variant="outline" className="mt-4 rounded-xl border-zinc-200 dark:border-white/10 dark:text-white dark:hover:bg-white/5 bg-transparent shadow-none">
          <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="h-14 w-14 rounded-2xl bg-white dark:bg-[#18181A] border border-zinc-200 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-[#1E1E20] text-zinc-600 dark:text-white/70 transition-all shadow-sm"
            size="icon"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white/90">
                {call.roomId}
              </h1>
              {!call.endedAt && (
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-none px-3 py-1 font-bold animate-pulse">
                  Live Session
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-zinc-500 dark:text-white/50 font-medium mt-1.5">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-zinc-400 dark:text-white/40" />
                {format(new Date(call.createdAt), "MMMM d, yyyy")}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-zinc-400 dark:text-white/40" />
                {format(new Date(call.createdAt), "HH:mm")}
                <span className="opacity-40 ml-1">|</span>
                {getDuration(call.createdAt, call.endedAt)}
              </span>
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-zinc-400 dark:text-white/40" />
                {call.participants.length} Participants
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded dark:border-white/5 overflow-hidden shadow-sm">
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="bg-zinc-100 dark:bg-[#1A1A1C] p-1 rounded-xl mb-4 grid grid-cols-4 gap-1 border border-zinc-200 dark:border-white/5 h-12 shadow-sm">
            <TabsTrigger
              value="summary"
              className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#242427] data-[state=active]:text-zinc-900 dark:data-[state=active]:text-white text-zinc-500 dark:text-white/50 data-[state=active]:shadow-sm font-semibold text-sm transition-all h-full"
            >
              Summary
            </TabsTrigger>
            <TabsTrigger
              value="action-items"
              className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#242427] data-[state=active]:text-zinc-900 dark:data-[state=active]:text-white text-zinc-500 dark:text-white/50 data-[state=active]:shadow-sm font-semibold text-sm transition-all h-full"
            >
              Actions
            </TabsTrigger>
            <TabsTrigger
              value="transcripts"
              className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#242427] data-[state=active]:text-zinc-900 dark:data-[state=active]:text-white text-zinc-500 dark:text-white/50 data-[state=active]:shadow-sm font-semibold text-sm transition-all h-full"
            >
              Messages
            </TabsTrigger>
            <TabsTrigger
              value="media"
              className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#242427] data-[state=active]:text-zinc-900 dark:data-[state=active]:text-white text-zinc-500 dark:text-white/50 data-[state=active]:shadow-sm font-semibold text-sm transition-all h-full"
            >
              Media
            </TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-6 focus-visible:outline-none">
            <div className="bg-zinc-50 dark:bg-white/5 p-8 rounded-lg border border-zinc-200 dark:border-white/5 relative">
              <h4 className="text-sm font-bold mb-6 flex items-center gap-3 uppercase text-zinc-900 dark:text-white/90">
                <Sparkles className="h-5 w-5 text-emerald-500" /> Executive Summary
              </h4>

              <div className="min-h-[250px] max-h-[400px] overflow-y-auto custom-scrollbar relative pr-2">
                {call.callSummaryBlocks && call.callSummaryBlocks.length > 0 ? (
                  <div className="space-y-3">
                    {call.callSummaryBlocks.map((block: any, i: number) => (
                      <div key={i} className="group flex gap-4 transition-all duration-300 hover:bg-zinc-100 dark:hover:bg-white/10 p-4 rounded-2xl border border-transparent hover:border-zinc-200 dark:hover:border-white/10 bg-white dark:bg-[#1A1A1C] shadow-sm">
                        <div className="shrink-0 pt-1.5">
                          <div className="h-2 w-2 rounded-full bg-emerald-500/40 group-hover:bg-emerald-500 group-hover:scale-125 transition-all duration-300" />
                        </div>
                        <p className="flex-1 text-[13px] text-zinc-600 dark:text-white/70 leading-relaxed font-medium tracking-tight">
                          {block.content}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={FileText} message="AI is processing the meeting summary. Please check back in a few minutes." />
                )}
              </div>
            </div>
          </TabsContent>

          {/* Action Items Tab */}
          <TabsContent value="action-items" className="space-y-6 focus-visible:outline-none">
            <div className="bg-zinc-50 dark:bg-white/5 p-8 rounded-lg border border-zinc-200 dark:border-white/5">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-sm font-bold flex items-center gap-3 uppercase m-0 text-zinc-900 dark:text-white/90">
                  <ListChecks className="h-5 w-5 text-emerald-500" /> Action Items & Tasks
                </h4>
              </div>

              <div className=" min-h-[250px] max-h-[400px] overflow-y-auto custom-scrollbar relative">
                {actionItems.length > 0 ? (
                  <div className="space-y-4">
                    {actionItems.map((item: any, idx: number) => (
                      <ActionItemRow
                        key={item.id}
                        index={idx}
                        item={item}
                        members={teamMembers}
                        onUpdate={() => setEditingItemId(item.id)}
                        onRemove={() => deleteActionItem(item.id)}
                        onAccept={() => handleAcceptSingleActionItem(item)}
                        isEditing={editingItemId === item.id}
                        editForm={editForm}
                        setEditForm={setEditForm}
                        onSave={() => handleUpdateActionItem(item.id)}
                        onCancel={() => setEditingItemId(null)}
                        getAvatar={getAssigneeAvatar}
                      />
                    ))}

                    {hasNextActionItems && (
                      <div ref={actionRef} className="h-10 flex items-center justify-center mt-6">
                        {isLoadingActionItems && (
                          <Loader2 className="h-5 w-5 animate-spin text-zinc-400 dark:text-white/50" />
                        )}
                      </div>
                    )}
                  </div>
                ) : isLoadingActionItems ? (
                  <SkeletonList count={3} />
                ) : (
                  <EmptyState icon={CheckCircle2} message="No clear action items identified from this session." />
                )}
              </div>
            </div>
          </TabsContent>

          {/* Transcripts Tab */}
          <TabsContent value="transcripts" className="space-y-6 focus-visible:outline-none">
            <div className="bg-zinc-50 dark:bg-white/5 p-8 rounded-lg border-zinc-200 dark:border-white/5 relative">
              <h4 className="text-sm font-bold mb-8 flex items-center gap-3 uppercase text-zinc-900 dark:text-white/90">
                <MessageSquare className="h-5 w-5 text-emerald-500" /> Detailed Transcript
              </h4>

              <div className="min-h-[250px] max-h-[400px] overflow-y-auto custom-scrollbar relative">
                {transcripts.length > 0 ? (
                  <div className="space-y-1 pr-2">
                    {transcripts.map((msg: any) => (
                      <TranscriptRow key={msg.id} msg={msg} />
                    ))}
                    {hasNextTranscripts && (
                      <div ref={transcriptRef} className="h-10 flex items-center justify-center mt-8">
                        {isLoadingTranscripts && (
                          <Loader2 className="h-5 w-5 animate-spin text-zinc-400 dark:text-white/50" />
                        )}
                      </div>
                    )}
                  </div>
                ) : isLoadingTranscripts ? (
                  <SkeletonList count={5} />
                ) : (
                  <EmptyState icon={MessageSquare} message="No transcript data available for this session." />
                )}
              </div>
            </div>
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media" className="space-y-6 focus-visible:outline-none">
            <div className="bg-zinc-50 dark:bg-white/5 p-8 rounded-lg border border-zinc-200 dark:border-white/5 relative">
              <h4 className="text-sm font-bold mb-8 flex items-center gap-3 uppercase text-zinc-900 dark:text-white/90">
                <PlayCircle className="h-5 w-5 text-emerald-500" /> Call Media & Recordings
              </h4>

              <div className=" min-h-[250px] max-h-[400px] overflow-y-auto custom-scrollbar relative">
                {recordings.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {recordings.map((rec: any) => (
                      <Card key={rec.id} className="bg-white dark:bg-[#1A1A1C] border border-zinc-200 dark:border-white/5 rounded-xl overflow-hidden hover:border-zinc-300 dark:hover:border-white/10 hover:shadow-sm transition-all duration-300 group shadow-sm">
                        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4 min-w-0">
                            {/* Video Thumbnail Placeholder */}
                            <div className="relative shrink-0 h-16 w-24 bg-zinc-100 dark:bg-white/5 rounded-lg flex items-center justify-center border border-zinc-200 dark:border-white/5 overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              <Video className="h-6 w-6 text-zinc-400 dark:text-white/40 group-hover:text-emerald-500/60 transition-colors duration-300 relative z-10" />
                            </div>

                            {/* Info */}
                            <div className="min-w-0 flex-1">
                              <h5 className="text-sm font-medium text-zinc-900 dark:text-white/90 truncate">Meeting Recording</h5>
                              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] font-medium text-zinc-500 dark:text-white/60">
                                <span className="flex items-center gap-1 bg-zinc-100 dark:bg-white/5 px-1.5 py-0.5 rounded-md border border-transparent">
                                  <CalendarIcon className="h-3 w-3" />
                                  {format(new Date(rec.startedAt), "MMM d, yyyy")}
                                </span>
                                <span className="flex items-center gap-1 bg-zinc-100 dark:bg-white/5 px-1.5 py-0.5 rounded-md border border-transparent">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(rec.startedAt), "HH:mm")}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Button */}
                          <Button
                            variant="secondary"
                            size="sm"
                            className="shrink-0 w-full sm:w-auto rounded-lg h-8 px-4 text-[11px] font-medium bg-zinc-100 dark:bg-white/5 hover:bg-emerald-500 hover:text-white text-zinc-700 dark:text-white/80 transition-all duration-300 border border-transparent hover:border-emerald-500/20 shadow-none disabled:opacity-50"
                            disabled={!rec.fileUrl}
                            onClick={() => window.open(rec.fileUrl, '_blank')}
                          >
                            {rec.fileUrl ? (
                              <>Watch Video <ExternalLink className="h-3 w-3 ml-1.5" /></>
                            ) : (
                              <>Processing... <Loader2 className="h-3 w-3 ml-1.5 animate-spin" /></>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                    {hasNextRecordings && (
                      <div ref={mediaRef} className="col-span-full h-10 flex items-center justify-center mt-6">
                        {isLoadingRecordings && (
                          <Loader2 className="h-5 w-5 animate-spin text-zinc-400 dark:text-white/50" />
                        )}
                      </div>
                    )}
                  </div>
                ) : isLoadingRecordings ? (
                  <SkeletonList count={3} />
                ) : (
                  <EmptyState icon={Video} message="No cloud recordings were made during this session." />
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Sub-components
function ActionItemRow({ item, index, members, onUpdate, onRemove, onAccept, isEditing, editForm, setEditForm, onSave, onCancel, getAvatar }: any) {
  const [assigneeSearch, setAssigneeSearch] = useState("");

  return (
    <motion.div
      className={cn(
        "group relative flex flex-col gap-3 rounded-xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-[#1A1A1C] p-4 transition-all duration-200 shadow-sm",
        isEditing ? "border-emerald-500/30 shadow-md bg-zinc-50 dark:bg-white/5" : "hover:border-zinc-300 dark:hover:border-white/10 hover:shadow-md"
      )}
    >
      {/* Top Row: Index + Title + Delete/Actions */}
      <div className="flex items-start gap-3">
        <div className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-zinc-100 dark:bg-white/5 text-[10px] font-medium text-zinc-500 dark:text-white/60 transition-colors",
          item.status === 'ACCEPTED' && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
          item.status === 'PENDING' && "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
          item.status === 'REJECTED' && "bg-red-500/10 text-red-600 dark:text-red-400"
        )}>
          {String(index + 1).padStart(2, "0")}
        </div>

        <div className="flex-1 min-w-0 pt-[2px]">
          {isEditing ? (
            <Input
              value={editForm.content || ""}
              onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
              className="h-6 w-full border-none bg-transparent p-0 text-sm font-medium text-zinc-900 dark:text-white/90 placeholder:text-zinc-400 dark:placeholder:text-white/40 focus-visible:ring-0 shadow-none"
              placeholder="Task Title..."
              autoFocus
            />
          ) : (
            <div className={cn(
              "text-sm font-medium tracking-tight transition-all duration-300",
              item.status === 'ACCEPTED' ? "text-zinc-400 dark:text-white/40 line-through opacity-60" : "text-zinc-900 dark:text-white/90"
            )}>
              {item.content}
            </div>
          )}
        </div>

        {/* Action Group Top Right */}
        {!isEditing && (
          <div className="flex shrink-0 items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity -mr-2 -mt-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-6 w-6 rounded-md hover:bg-zinc-100 dark:hover:bg-white/5" onClick={() => { onUpdate(); setEditForm(item); }}>
                    <Edit2 className="h-3.5 w-3.5 text-zinc-500 dark:text-white/70" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit task</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 rounded-md hover:bg-emerald-500/10 hover:text-emerald-600 text-zinc-500 dark:text-white/70"
                    onClick={onAccept}
                    disabled={item.status === 'ACCEPTED'}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Approve to backlog</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" onClick={onRemove} className="h-6 w-6 rounded-md hover:bg-red-500/10 hover:text-red-500 text-zinc-500 dark:text-white/70">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete task</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>

      {/* Middle Row: Metadata Pills */}
      <div className="flex flex-wrap items-center gap-1">
        {/* Assignee */}
        {isEditing ? (
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-md bg-zinc-100 dark:bg-white/5 px-2 py-1 text-[11px] font-medium text-zinc-500 dark:text-white/60 hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors border border-transparent hover:border-zinc-300 dark:hover:border-white/20">
                <UserPlus className="h-3 w-3 opacity-70" />
                {editForm.assigneeId ? (
                  <span className="max-w-[120px] truncate items-center">
                    {members.find((m: any) => m.id === editForm.assigneeId || m.userId === editForm.assigneeId)?.name || "Assignee"}
                  </span>
                ) : "Assignee"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0 bg-white dark:bg-[#1A1A1C] border-zinc-200 dark:border-white/10" align="start">
              <Command shouldFilter={false} className="bg-transparent text-zinc-900 dark:text-white/90">
                <CommandInput
                  placeholder="Search member..."
                  value={assigneeSearch}
                  onValueChange={setAssigneeSearch}
                  className="h-8 text-xs"
                />
                <CommandList>
                  <CommandEmpty>No member found.</CommandEmpty>
                  <CommandGroup>
                    {members
                      .filter((m: any) => m.name?.toLowerCase().includes(assigneeSearch.toLowerCase()))
                      .map((member: any) => {
                        const isSelected = editForm.assigneeId === (member.userId || member.id);
                        return (
                          <CommandItem
                            key={member.id}
                            onSelect={() => {
                              setEditForm({ ...editForm, assigneeId: isSelected ? null : (member.userId || member.id) });
                              setAssigneeSearch("");
                            }}
                            className="text-xs cursor-pointer text-zinc-700 dark:text-white/80 aria-selected:bg-zinc-100 dark:aria-selected:bg-white/10"
                          >
                            <Avatar className="h-5 w-5 mr-2">
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback>{(member.name || "?").charAt(0)}</AvatarFallback>
                            </Avatar>
                            {member.name}
                            {isSelected && <Check className="ml-auto h-3 w-3 text-emerald-500" />}
                          </CommandItem>
                        );
                      })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        ) : item.assigneeId && (
          <div className="flex items-center gap-1.5 rounded-md bg-zinc-100 dark:bg-white/5 px-2 py-0.5 border border-zinc-200 dark:border-white/5">
            {getAvatar(item.assigneeId)}
            <span className="truncate max-w-[120px] text-[11px] font-medium text-zinc-500 dark:text-white/70">
              {members.find((m: any) => m.id === item.assigneeId || m.userId === item.assigneeId)?.name || "Assignee"}
            </span>
          </div>
        )}

        {/* Separator - Only show if both Assignee and Date exist */}
        {((isEditing && editForm.assigneeId) || (!isEditing && item.assigneeId)) && (
          <div className="h-3 w-px bg-zinc-200 dark:bg-white/10 mx-1" />
        )}

        {/* Date Inputs / Display */}
        {isEditing ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded bg-zinc-100 dark:bg-white/5 px-1.5 py-0.5 border border-transparent hover:border-zinc-300 dark:hover:border-white/20 transition-colors">
              <CalendarIcon className="h-3 w-3 text-zinc-400 dark:text-white/50" />
              <input
                type="date"
                value={editForm.startDate ? format(new Date(editForm.startDate), "yyyy-MM-dd") : ""}
                onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                className="bg-transparent text-[10px] font-medium text-zinc-500 dark:text-white/60 focus:outline-none w-[70px]"
              />
            </div>
            <span className="text-zinc-400 dark:text-white/40 text-[10px]">to</span>
            <div className="flex items-center gap-1.5 rounded bg-zinc-100 dark:bg-white/5 px-1.5 py-0.5 border border-transparent hover:border-zinc-300 dark:hover:border-white/20 transition-colors">
              <Clock className="h-3 w-3 text-zinc-400 dark:text-white/50" />
              <input
                type="date"
                value={editForm.endDate ? format(new Date(editForm.endDate), "yyyy-MM-dd") : ""}
                onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                className="bg-transparent text-[10px] font-medium text-zinc-500 dark:text-white/60 focus:outline-none w-[70px]"
              />
            </div>
          </div>
        ) : (item.startDate || item.endDate) && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded bg-zinc-100 dark:bg-white/5 px-1.5 py-0.5 border border-transparent">
              <CalendarIcon className="h-3 w-3 text-zinc-400 dark:text-white/50" />
              <span className="text-[10px] font-medium text-zinc-500 dark:text-white/70">
                {item.startDate ? format(new Date(item.startDate), "MMM d, yyyy") : "..."}
              </span>
            </div>
            <span className="opacity-40 text-[10px]">to</span>
            <div className="flex items-center gap-1.5 rounded bg-zinc-100 dark:bg-white/5 px-1.5 py-0.5 border border-transparent">
              <Clock className="h-3 w-3 text-zinc-400 dark:text-white/50" />
              <span className="text-[10px] font-medium text-zinc-500 dark:text-white/70">
                {item.endDate ? format(new Date(item.endDate), "MMM d, yyyy") : "..."}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Editing Actions Footer (only when editing) */}
      {isEditing && (
        <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-zinc-200 dark:border-white/10">
          <Button size="sm" variant="ghost" className="h-7 text-[11px] font-medium text-zinc-500 hover:bg-zinc-100 dark:text-white/70 dark:hover:bg-white/5 dark:hover:text-white" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" className="h-7 text-[11px] font-medium shadow-none bg-emerald-500 text-white hover:bg-emerald-600 transition-colors" onClick={onSave}>
            Save Changes
          </Button>
        </div>
      )}
    </motion.div>
  );
}

function TranscriptRow({ msg }: { msg: CallTranscript }) {
  return (
    <div className="group flex gap-4 transition-all duration-300 hover:bg-zinc-50 dark:hover:bg-white/5 p-3 rounded-2xl">
      {/* Avatar */}
      <div className="shrink-0 pt-0.5">
        <div className="h-9 w-9 bg-emerald-500/10 rounded-full flex items-center justify-center text-[13px] font-semibold text-emerald-600 dark:text-emerald-500 border border-emerald-500/20 group-hover:scale-105 transition-all duration-300">
          {msg.userName ? msg.userName.charAt(0).toUpperCase() : (msg.userId ? msg.userId.charAt(0).toUpperCase() : "U")}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2.5 mb-1">
          <span className="font-medium text-[13px] text-zinc-900 dark:text-white/90 tracking-tight">
            {msg.userName || `User ${msg.userId.split('-')[0]}`}
          </span>
          <span className="text-[10px] font-medium text-zinc-500 dark:text-white/50">
            {format(new Date(msg.timestamp), "h:mm a")}
          </span>
        </div>
        <p className="text-[13px] text-zinc-600 dark:text-white/70 leading-relaxed font-medium">
          {msg.content}
        </p>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: any, message: string }) {
  return (
    <div className="py-20 flex flex-col items-center justify-center text-center px-4 bg-zinc-50 dark:bg-[#18181A]/50 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-white/5">
      <div className="h-16 w-16 bg-zinc-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
        <Icon className="h-8 w-8 text-zinc-400 dark:text-white/20" />
      </div>
      <p className="text-zinc-500 dark:text-white/50 font-bold max-w-sm text-lg leading-tight">
        {message}
      </p>
    </div>
  );
}

function SkeletonList({ count }: { count: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-2xl bg-zinc-200 dark:bg-white/5 border-none" />
      ))}
    </div>
  );
}
