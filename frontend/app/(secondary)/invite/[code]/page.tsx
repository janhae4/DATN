"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useDiscussionMutations } from "@/hooks/useDiscussion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, UserPlus, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

import { discussionService } from "@/services/discussionService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
            <div className="flex h-screen items-center justify-center bg-gray-950">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="flex h-screen items-center justify-center bg-gray-950 p-4">
            <Card className="w-full max-w-md border-gray-800 bg-gray-900 text-white shadow-2xl overflow-hidden">
                <div className="h-2 bg-indigo-500" />
                <CardHeader className="text-center pt-8">
                    <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-2xl bg-gray-800 p-1 shadow-inner">
                        {inviteData?.serverAvatar ? (
                            <img src={inviteData.serverAvatar} alt={inviteData.serverName} className="h-full w-full rounded-xl object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center rounded-xl bg-indigo-500 text-3xl font-bold">
                                {inviteData?.serverName?.substring(0, 1).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <CardTitle className="text-2xl font-bold">{inviteData?.serverName || "Server Invitation"}</CardTitle>
                    <CardDescription className="text-gray-400">
                        Bạn đã nhận được lời mời tham gia server này.
                    </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col items-center py-6">
                    {!user ? (
                        <div className="text-center space-y-4 w-full px-4">
                            <p className="text-amber-400 text-sm">Vui lòng đăng nhập để chấp nhận lời mời này.</p>
                            <Link href={`/auth?join=${code}`} className="w-full block">
                                <Button className="w-full bg-indigo-600 hover:bg-indigo-500 py-6 text-base font-semibold">
                                    Đăng nhập / Đăng ký
                                </Button>
                            </Link>
                        </div>
                    ) : status === "idle" ? (
                        <div className="text-center w-full px-4">
                            <p className="mb-6 text-gray-300 text-sm">Bạn đã sẵn sàng tham gia cùng mọi người chưa?</p>
                            <Button
                                onClick={handleJoin}
                                className="w-full bg-indigo-600 py-6 text-lg font-bold hover:bg-indigo-500 transition-all hover:scale-[1.02]"
                            >
                                <UserPlus className="mr-2 h-5 w-5" />
                                Chấp nhận lời mời
                            </Button>
                        </div>
                    ) : status === "already_member" ? (
                        <div className="text-center w-full px-4">
                            <div className="mb-6 flex flex-col items-center gap-2">
                                <CheckCircle2 className="h-10 w-10 text-indigo-400" />
                                <p className="text-indigo-300 font-medium">Bạn đã là thành viên của server này!</p>
                            </div>
                            <Link href={`/${inviteData?.teamId}/chat`} className="w-full block">
                                <Button
                                    className="w-full bg-gray-800 border border-indigo-500/30 text-indigo-300 py-6 text-lg font-bold hover:bg-gray-700 transition-all"
                                >
                                    Vào Server Ngay
                                </Button>
                            </Link>
                        </div>
                    ) : status === "joining" ? (
                        <div className="flex flex-col items-center space-y-4 py-4">
                            <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
                            <p className="text-gray-400 animate-pulse text-lg">Đang tham gia server...</p>
                        </div>
                    ) : status === "success" ? (
                        <div className="flex flex-col items-center space-y-4 text-center">
                            <div className="rounded-full bg-green-500/10 p-4">
                                <CheckCircle2 className="h-16 w-16 text-green-500" />
                            </div>
                            <h3 className="text-xl font-bold text-green-400">Tuyệt vời!</h3>
                            <p className="text-gray-300">Chào mừng bạn mới. Bạn sẽ được chuyển hướng ngay...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center space-y-4 text-center">
                            <XCircle className="h-16 w-16 text-red-500" />
                            <h3 className="text-xl font-bold text-red-400">Rất tiếc!</h3>
                            <p className="text-gray-400">{errorMsg}</p>
                            <Button variant="outline" onClick={() => setStatus("idle")} className="border-gray-700 hover:bg-gray-800">
                                Thử lại
                            </Button>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="justify-center border-t border-gray-800 bg-gray-950/50 py-4">
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">
                        Invite Code: {code}
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
