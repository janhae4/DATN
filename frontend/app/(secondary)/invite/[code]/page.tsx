"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useDiscussionMutations } from "@/hooks/useDiscussion";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

import { discussionService } from "@/services/discussionService";

export default function InvitePage() {
    const { code } = useParams();
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const { joinServer } = useDiscussionMutations();

    const [inviteData, setInviteData] = useState<{
        serverName: string;
        serverAvatar?: string;
        participantIds: string[];
        teamId: string;
    } | null>(null);

    const [status, setStatus] = useState<"loading" | "idle" | "joining" | "success" | "already_member" | "error">("loading");
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        if (!code || typeof code !== "string") return;

        const fetchInvite = async () => {
            try {
                const data = await discussionService.getInvite(code);
                setInviteData(data);

                if (user && data.participantIds.includes(user.id)) {
                    setStatus("already_member");
                    setTimeout(() => {
                        router.push(`/${data.teamId}/chat`);
                    }, 1500);
                } else {
                    setStatus("idle");
                }
            } catch (err) {
                console.error("Fetch invite error:", err);
                setStatus("error");
                setErrorMsg("Mã mời không tồn tại hoặc đã hết hạn.");
            }
        };

        fetchInvite();
    }, [code, user, router]);

    const handleJoin = async () => {
        if (!code || typeof code !== "string" || !inviteData) return;

        setStatus("joining");
        try {
            await joinServer(code);
            setStatus("success");

            setTimeout(() => {
                router.push(`/${inviteData.teamId}/chat`);
            }, 2000);
        } catch (err: any) {
            console.error("Join server error:", err);
            setStatus("error");
            setErrorMsg(err.response?.data?.message || "Không thể tham gia server này.");
        }
    };

    if (authLoading || status === "loading") {
        return (
            <div className="flex h-screen items-center justify-center bg-black">
                <Loader2 className="h-4 w-4 animate-spin text-white" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-black p-4 font-sans text-zinc-200 selection:bg-zinc-800 selection:text-white">
            <div className="w-full max-w-sm animate-in fade-in zoom-in-95 duration-300 rounded-xl border border-zinc-800 bg-black p-8 shadow-2xl">

                <div className="flex flex-col items-center gap-6">
                    <div className="relative h-24 w-24 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-inner">
                        {inviteData?.serverAvatar ? (
                            <img
                                src={inviteData.serverAvatar}
                                alt={inviteData.serverName}
                                className="h-full w-full object-cover grayscale transition-all duration-500 hover:grayscale-0"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-3xl font-light text-white">
                                {inviteData?.serverName?.substring(0, 1).toUpperCase()}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2 text-center">
                        <div className="flex items-center justify-center gap-2 text-xs font-medium tracking-widest uppercase text-zinc-500">
                            INVITATION
                        </div>
                        <h1 className="text-2xl font-semibold tracking-tight text-white">
                            {inviteData?.serverName || "Unknown Server"}
                        </h1>
                        <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                            <span>{inviteData?.participantIds?.length || 0} members</span>
                        </div>
                    </div>
                </div>

                <div className="pt-8">
                    {!user ? (
                        <div className="space-y-4">
                            <Link href={`/auth?join=${code}`} className="block w-full">
                                <Button className="w-full h-10 rounded-md bg-white text-black hover:bg-zinc-200 font-medium text-sm transition-colors border border-transparent">
                                    Continue with Email
                                </Button>
                            </Link>
                            <p className="text-center text-[10px] text-zinc-600 uppercase tracking-wider">
                                Authentication Required
                            </p>
                        </div>
                    ) : status === "idle" ? (
                        <Button
                            onClick={handleJoin}
                            className="w-full h-10 rounded-md bg-white text-black hover:bg-zinc-200 font-medium text-sm transition-colors border border-transparent shadow-lg shadow-white/5"
                        >
                            Accept Invite
                        </Button>
                    ) : status === "already_member" ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-center gap-2 text-zinc-400 text-sm">
                                <CheckCircle2 className="h-4 w-4 text-white" />
                                <span>Already joined</span>
                            </div>
                            <Link href={`/${inviteData?.teamId}/chat`} className="block w-full">
                                <Button className="w-full h-10 rounded-md bg-zinc-900 text-white hover:bg-zinc-800 font-medium text-sm transition-colors border border-zinc-800">
                                    Enter Workspace
                                </Button>
                            </Link>
                        </div>
                    ) : status === "joining" ? (
                        <div className="flex items-center justify-center gap-3 py-3 text-zinc-500 text-sm">
                            <Loader2 className="h-4 w-4 animate-spin text-white" />
                            <span>Verifying access...</span>
                        </div>
                    ) : status === "success" ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-2">
                            <div className="h-10 w-10 flex items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/50 text-white mb-1">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <span className="text-white text-sm font-medium">Access Granted</span>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-center gap-3 border border-zinc-800 bg-zinc-900/50 p-3 rounded-md">
                                <XCircle className="h-4 w-4 flex-shrink-0 text-white" />
                                <span className="text-xs font-medium text-zinc-400">{errorMsg}</span>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => setStatus("idle")}
                                className="w-full h-9 border-zinc-800 bg-black text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-md text-xs"
                            >
                                Retry
                            </Button>
                        </div>
                    )}
                </div>

                {/* Minimal Footer */}
                <div className="pt-8 text-center">
                    <p className="text-[10px] font-mono text-zinc-700 tracking-widest uppercase truncate max-w-[150px] mx-auto group cursor-help">
                        <span className="group-hover:text-zinc-500 transition-colors">{code}</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
