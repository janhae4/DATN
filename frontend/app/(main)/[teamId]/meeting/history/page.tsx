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
import { Card, CardContent } from "@/components/ui/card";
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
                    <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
                        Meeting History
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Browse through past sessions and view details.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Search by room name..."
                            className="pl-10 h-11 bg-card border-muted-foreground/20 focus:ring-primary shadow-sm rounded-xl"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {loading && history.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-48 w-full rounded-3xl" />
                    ))}
                </div>
            ) : filteredHistory.length === 0 ? (
                <Card className="flex flex-col items-center justify-center py-24 text-center border-dashed rounded-3xl bg-muted/20">
                    <Video className="h-16 w-16 text-muted-foreground mb-6 opacity-20" />
                    <h3 className="text-2xl font-semibold text-foreground">No meetings found</h3>
                    <p className="text-muted-foreground mt-2 max-w-xs mx-auto">
                        {searchQuery ? "We couldn't find anything matching your search." : "Start a call to see your history building up here."}
                    </p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredHistory.map((meeting) => (
                        <Card
                            key={meeting.id}
                            className="rounded-[32px] bg-card hover:bg-gray-50/50 transition-all duration-300 group cursor-pointer overflow-hidden border border-muted-foreground/5"
                            onClick={() => handleViewDetails(meeting.id)}
                        >
                            <CardContent className="p-0">
                                <div className="p-6 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">

                                            <div className="p-4 bg-primary/10 rounded-2xl text-primary">
                                                <Video className="h-6 w-6" />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="font-bold text-foreground truncate">
                                                    {meeting.roomId.length > 12 ? meeting.roomId.slice(0, 12) + "..." : meeting.roomId}
                                                </h3>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {format(new Date(meeting.createdAt), "MMM d, yyyy")}
                                                </div>
                                            </div>
                                        </div>
                                        {!meeting.endedAt && (
                                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-none px-3 py-1 animate-pulse font-bold">
                                                Live
                                            </Badge>
                                        )}
                                    </div>


                                    <div className="grid grid-cols-2 gap-4 py-2">
                                        <div className="space-y-1">
                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground opacity-60">Duration</p>
                                            <div className="flex items-center gap-2 text-sm font-bold">
                                                <Clock className="h-3.5 w-3.5 text-primary/60" />
                                                {getDuration(meeting.createdAt, meeting.endedAt)}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground opacity-60">Participants</p>
                                            <div className="flex items-center gap-2 text-sm font-bold">
                                                <Users className="h-3.5 w-3.5 text-primary/60" />
                                                {meeting.participants.length}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-6 py-4 border-t border-muted-foreground/5 flex items-center justify-between group-hover:bg-primary/5 transition-colors">
                                    <span className="text-sm group-hover:translate-x-1 transition-transform">View Details</span>
                                    <ArrowRight className="h-4 w-4 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    <div ref={loadMoreRef} className="col-span-full py-10 flex justify-center">
                        {loading ? (
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                <p className="text-sm text-muted-foreground font-medium">Loading more...</p>
                            </div>
                        ) : hasMore ? (
                            <div className="h-4" />
                        ) : history.length > 0 ? (
                            <div className="text-muted-foreground text-sm font-medium bg-muted/30 px-6 py-2 rounded-full border border-muted-foreground/10">
                                End of history
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
}
