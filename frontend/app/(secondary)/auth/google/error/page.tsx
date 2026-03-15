"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, Loader2, MailWarning } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function GoogleErrorPage() {
    const router = useRouter();
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        toast.error("Account Already Linked", {
            description: "The Google account is already used in another workspace."
        });

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    // Automatically redirect to dashboard after countdown
                    router.push("/dashboard");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [router]);

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden p-4">
            {/* Background Gradients */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-red-500/10 dark:bg-red-500/5 blur-[100px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-orange-500/10 dark:bg-orange-500/5 blur-[100px]" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative z-10 max-w-md w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-2xl rounded-3xl p-8 border border-zinc-200/50 dark:border-zinc-800/50 text-center"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                    className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-red-100 to-red-50 dark:from-red-900/40 dark:to-red-900/10 shadow-inner mb-6 border border-red-100 dark:border-red-900/50 box-content relative"
                >
                    <div className="absolute inset-0 rounded-full border-2 border-red-500/20 dark:border-red-500/10 animate-ping duration-[3000ms]" />
                    <XCircle className="h-10 w-10 text-red-500 dark:text-red-400 relative z-10" />
                </motion.div>

                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mb-3">
                    Link Unsuccessful
                </h1>

                <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed px-2">
                    This Google account is already linked to another <span className="font-semibold text-zinc-700 dark:text-zinc-300">Taskora</span> profile. You cannot link the same provider to multiple accounts.
                </p>

                <div className="space-y-4">
                    <Button
                        size="lg"
                        onClick={() => router.push("/dashboard")}
                        className="w-full bg-gradient-to-r from-zinc-900 to-zinc-800 text-white hover:from-zinc-800 hover:to-zinc-700 dark:from-zinc-100 dark:to-zinc-200 dark:text-zinc-900 dark:hover:from-white dark:hover:to-zinc-100 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl font-medium"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Return to Dashboard
                    </Button>

                    <div className="flex items-center justify-center gap-2 pt-2 text-xs font-medium text-zinc-400 dark:text-zinc-500 h-6">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        >
                            <Loader2 className="h-3.5 w-3.5" />
                        </motion.div>
                        <span>Redirecting automatically in <span className="text-zinc-600 dark:text-zinc-300 font-bold tabular-nums">{countdown}s</span>...</span>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800/50">
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center justify-center gap-1.5">
                        <MailWarning className="h-3.5 w-3.5" />
                        Believe this is a mistake? <a href="#" className="underline hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">Contact Support</a>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

