"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
    ArrowLeft,
    Trash2,
    RotateCcw,
    Inbox,
    Clock,
    AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays, addDays } from "date-fns";

import { useUserProfile } from "@/hooks/useAuth";
import { useDeletedServers, useDiscussionMutations } from "@/hooks/useDiscussion";

import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function DeletedServersPage() {
    const { data: user } = useUserProfile();
    const userId = user?.id;
    const { teamId: currentTeamId } = useParams();

    const { data: deletedServers = [], isLoading } = useDeletedServers(userId || "");
    const { restoreServer, permanentDeleteServer } = useDiscussionMutations();

    const handleRestore = async (serverName: string, id: string) => {
        try {
            toast.promise(restoreServer(id), {
                loading: "Restoring...",
                success: `${serverName} has been restored!`,
                error: "Failed to restore."
            });
        } catch (error) {
            console.error("Restore error:", error);
        }
    };

    const handlePermanentDelete = async (serverName: string, id: string) => {
        try {
            toast.promise(permanentDeleteServer(id), {
                loading: "Deleting forever...",
                success: `${serverName} has been deleted forever.`,
                error: "Failed to delete server."
            });
        } catch (error) {
            console.error("Permanent delete error:", error);
        }
    };

    // Tính số ngày còn lại trước khi tự hủy (giả sử 30 ngày)
    const getDaysRemaining = (deletedAt: string) => {
        if (!deletedAt) return 30;
        const purgeDate = addDays(new Date(deletedAt), 30);
        const remaining = differenceInDays(purgeDate, new Date());
        return remaining > 0 ? remaining : 0;
    };

    return (
        <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-zinc-900 selection:text-white">
            <div className="max-w-6xl mx-auto px-6 py-12">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div className="space-y-4">
                        <Link
                            href={`/${currentTeamId}/chat`}
                            className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors group"
                        >
                            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            <span>Back to Chat</span>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Trash</h1>
                            <p className="text-zinc-500 mt-2 max-w-lg text-sm leading-relaxed">
                                Servers in trash are permanently deleted after <span className="font-semibold text-red-500">30 days</span>.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="w-full">
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-[180px] w-full bg-zinc-200 dark:bg-zinc-900/50 animate-pulse rounded-2xl" />
                            ))}
                        </div>
                    ) : deletedServers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-white/50 dark:bg-zinc-900/20">
                            <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-4">
                                <Inbox className="w-8 h-8 text-zinc-400 stroke-[1.5]" />
                            </div>
                            <h3 className="text-lg font-semibold">Clean and empty!</h3>
                            <p className="text-zinc-500 text-sm mt-1">No servers in trash.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {deletedServers.map((server: any) => {
                                const daysRemaining = getDaysRemaining(server.deletedAt);
                                const isUrgent = daysRemaining <= 3;

                                return (
                                    <div
                                        key={server.id}
                                        className="group relative flex flex-col justify-between bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-2xl p-5 hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-black/40 transition-all duration-300"
                                    >
                                        {/* Top Section */}
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-center gap-3.5">
                                                <Avatar className="h-12 w-12 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                                                    <AvatarImage src={server.avatar} className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                                                    <AvatarFallback className="rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-sm font-bold">
                                                        {server.name?.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="space-y-1">
                                                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 leading-none truncate max-w-[140px]">
                                                        {server.name}
                                                    </h3>
                                                    <p className="text-[11px] font-mono text-zinc-400 uppercase tracking-wide">
                                                        {server.id.slice(0, 8)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Days Remaining Badge */}
                                            <Badge variant="secondary" className={`text-[10px] px-2 h-6 rounded-md font-medium border ${isUrgent ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-950/30 dark:border-red-900' : 'bg-zinc-50 text-zinc-500 border-zinc-100 dark:bg-zinc-800 dark:border-zinc-700'}`}>
                                                {daysRemaining} days left
                                            </Badge>
                                        </div>

                                        <Separator className="my-4 bg-zinc-100 dark:bg-zinc-800" />

                                        {/* Bottom Section: Info & Actions */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-xs text-zinc-400 group-hover:text-zinc-500 transition-colors">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>
                                                    {server.deletedAt ? format(new Date(server.deletedAt), 'MMM d') : 'Just now'}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleRestore(server.name, server.id)}
                                                    className="h-8 px-3 text-xs font-medium bg-white hover:bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 hover:text-green-600 hover:border-green-200 transition-all"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                                                    Restore
                                                </Button>

                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete forever?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. Server <span className="font-medium text-foreground">{server.name}</span> will be permanently deleted.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handlePermanentDelete(server.name, server.id)}
                                                                className="bg-red-600 hover:bg-red-700 text-white"
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}