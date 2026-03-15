"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
    Video,
    Calendar,
    Clock,
    Users,
    Search,
    Loader2,
    ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { videoChatService } from "@/services/videoChatService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useInView } from "react-intersection-observer";

interface CallParticipant {
    userId: string;
    role: string;
    joinedAt: string;
    leftAt?: string;
}

interface MeetingHistory {
    id: string;
    roomId: string;
    createdAt: string;
    endedAt?: string;
    participants: CallParticipant[];
}

export default function MeetingHistoryPage() {
    const { user } = useAuth();
    const { teamId } = useParams();
    const router = useRouter();

    const [history, setHistory] = useState<MeetingHistory[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const { ref: loadMoreRef, inView } = useInView({
        threshold: 0.1,
    });

    const fetchHistory = useCallback(async (pageNum: number, isNewSearch = false) => {
        if (!teamId) return;
        try {
            if (isNewSearch) {
                setLoading(true);
                setPage(1);
            }

            const result = await videoChatService.getTeamHistory(teamId as string, pageNum, 12);
            const data = result.data || [];

            if (isNewSearch) {
                setHistory(data);
            } else {
                setHistory(prev => {
                    const existingIds = new Set(prev.map(m => m.id));
                    const newItems = data.filter((m: any) => !existingIds.has(m.id));
                    return [...prev, ...newItems];
                });
            }

            setHasMore(data.length === 12);
            setPage(pageNum);
        } catch (error) {
            console.error("Failed to fetch history:", error);
            toast.error("Failed to load meeting history");
        } finally {
            setLoading(false);
        }
    }, [teamId]);

    useEffect(() => {
        if (user?.id) {
            fetchHistory(1, true);
        }
    }, [user, teamId, fetchHistory]);

    useEffect(() => {
        if (inView && hasMore && !loading) {
            fetchHistory(page + 1);
        }
    }, [inView, hasMore, loading, page, fetchHistory]);

    const getDuration = (start: string, end?: string) => {
        if (!end) return "Ongoing";
        const startTime = new Date(start).getTime();
        const endTime = new Date(end).getTime();
        const diff = Math.floor((endTime - startTime) / 1000 / 60);
        if (diff < 1) return "< 1 min";
        return `${diff} min`;
    };

    const handleViewDetails = (callId: string) => {
        router.push(`/${teamId}/meeting/summary/${callId}`);
    };

    const filteredHistory = history.filter(m =>
        m.roomId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="container mx-auto py-8 max-w-6xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-bold  tracking-tight text-zinc-900 dark:text-white/90">
                        Meeting History
                    </h1>
                    <p className="text-zinc-500 dark:text-white/50 mt-2">
                        Browse through past sessions and view details.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 dark:text-white/40" />
                        <Input
                            placeholder="Search by room name..."
                            className="pl-10 h-11 bg-white dark:bg-[#18181A] border-zinc-200 dark:border-white/5 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-white/40 focus:ring-1 focus:ring-zinc-200 dark:focus:ring-white/20 shadow-none rounded-xl"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {loading && history.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-[240px] w-full rounded-2xl bg-zinc-100 dark:bg-[#18181A] animate-pulse border border-zinc-200 dark:border-white/5 shadow-sm" />
                    ))}
                </div>
            ) : filteredHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-zinc-200 dark:border-white/5 rounded-3xl bg-zinc-50 dark:bg-[#18181A]/50 col-span-full shadow-sm">
                    <Video className="h-16 w-16 text-zinc-300 dark:text-white/20 mb-6" />
                    <h3 className="text-2xl font-semibold text-zinc-900 dark:text-white/90">No meetings found</h3>
                    <p className="text-zinc-500 dark:text-white/50 mt-2 max-w-xs mx-auto">
                        {searchQuery ? "We couldn't find anything matching your search." : "Start a call to see your history building up here."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredHistory.map((meeting) => (
                        <div
                            key={meeting.id}
                            className="bg-white dark:bg-[#18181A] border border-zinc-200 dark:border-white/5 rounded-[24px] p-6 hover:bg-zinc-50 dark:hover:bg-[#1E1E20] hover:border-zinc-300 dark:hover:border-white/10 transition-all duration-300 group cursor-pointer flex flex-col gap-4 relative shadow-sm"
                            onClick={() => handleViewDetails(meeting.id)}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-zinc-100 dark:bg-white/5 rounded-[14px] text-zinc-600 dark:text-white/70 group-hover:text-zinc-900 dark:group-hover:text-white/90 group-hover:bg-zinc-200 dark:group-hover:bg-white/10 transition-all">
                                        <Video className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-semibold text-zinc-900 dark:text-white/90 truncate max-w-[150px] text-lg">
                                            {meeting.roomId}
                                        </h3>
                                    </div>
                                </div>
                                {!meeting.endedAt && (
                                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-none px-2.5 py-0.5 animate-pulse font-medium text-xs">
                                        Live
                                    </Badge>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[11px] uppercase text-zinc-500 dark:text-white/40 font-medium tracking-wider">Date</span>
                                    <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-white/80 font-medium">
                                        <Calendar className="h-4 w-4 text-zinc-400 dark:text-white/40" />
                                        {format(new Date(meeting.createdAt), "MMM d, yyyy")}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[11px] uppercase text-zinc-500 dark:text-white/40 font-medium tracking-wider">Duration</span>
                                    <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-white/80 font-medium">
                                        <Clock className="h-4 w-4 text-zinc-400 dark:text-white/40" />
                                        {getDuration(meeting.createdAt, meeting.endedAt)}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5 mt-2">
                                    <span className="text-[11px] uppercase text-zinc-500 dark:text-white/40 font-medium tracking-wider">Participants</span>
                                    <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-white/80 font-medium">
                                        <Users className="h-4 w-4 text-zinc-400 dark:text-white/40" />
                                        {meeting.participants.length}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-white/5 flex items-center justify-between group-hover:border-zinc-300 dark:group-hover:border-white/10 transition-colors">
                                <span className="text-sm font-medium text-zinc-600 dark:text-white/60 group-hover:text-zinc-900 dark:group-hover:text-white/90 transition-colors">View Details</span>
                                <ArrowRight className="h-4 w-4 text-zinc-400 dark:text-white/40 group-hover:text-zinc-900 dark:group-hover:text-white/90 group-hover:translate-x-1 transition-all" />
                            </div>
                        </div>
                    ))}

                    <div ref={loadMoreRef} className="col-span-full py-10 flex justify-center">
                        {loading ? (
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="h-8 w-8 text-zinc-400 dark:text-white/50 animate-spin" />
                                <p className="text-sm text-zinc-500 dark:text-white/50 font-medium">Loading more...</p>
                            </div>
                        ) : hasMore ? (
                            <div className="h-4" />
                        ) : history.length > 0 ? (
                            <div className="text-zinc-500 dark:text-white/50 text-sm font-medium bg-zinc-100 dark:bg-[#18181A]/50 px-6 py-2 rounded-full border border-zinc-200 dark:border-white/5 shadow-sm">
                                End of history
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
}
