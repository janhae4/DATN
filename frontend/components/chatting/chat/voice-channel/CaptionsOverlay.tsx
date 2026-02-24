import React, { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { CaptionEntry } from "@/hooks/chat/useVoiceSocket";

interface CaptionsOverlayProps {
    captions: Map<string, CaptionEntry>;
    visible: boolean;
}

interface HistoryLine {
    id: string;
    userId: string;
    name: string;
    text: string;
}

export const CaptionsOverlay: React.FC<CaptionsOverlayProps> = ({ captions, visible }) => {
    const [history, setHistory] = useState<HistoryLine[]>([]);
    const prevCaptionsRef = useRef<Map<string, CaptionEntry>>(new Map());
    const containerRef = useRef<HTMLDivElement>(null);

    // State để track xem user có đang ở dưới cùng không
    const [isAutoScroll, setIsAutoScroll] = useState(true);

    useEffect(() => {
        const prev = prevCaptionsRef.current;

        captions.forEach((entry, userId) => {
            const prevEntry = prev.get(userId);
            const justFinalized = entry.isFinal && (!prevEntry || !prevEntry.isFinal || prevEntry.text !== entry.text);

            if (justFinalized && entry.text.trim()) {
                setHistory((h) => [
                    ...h,
                    {
                        id: `${userId}-${entry.timestamp}`,
                        userId,
                        name: entry.name,
                        text: entry.text.trim(),
                    },
                ]);
            }
        });

        prevCaptionsRef.current = new Map(
            Array.from(captions.entries()).map(([k, v]) => [k, { ...v }])
        );
    }, [captions]);

    // Bắt sự kiện cuộn: Nếu user chủ động cuộn lên trên, tắt auto-scroll
    const handleScroll = useCallback(() => {
        const el = containerRef.current;
        if (!el) return;
        const { scrollTop, scrollHeight, clientHeight } = el;
        // Nếu cách đáy dưới 40px thì bật lại auto-scroll, ngược lại là user đang xem lịch sử
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 40;
        setIsAutoScroll(isNearBottom);
    }, []);

    // Smart Auto-scroll: Chỉ chạy khi isAutoScroll = true
    useEffect(() => {
        const el = containerRef.current;
        if (!el || !isAutoScroll) return;
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, [history.length, captions, isAutoScroll]);

    const activeInterim = Array.from(captions.values()).filter(
        (e) => e.text && !e.isFinal
    );

    const hasContent = history.length > 0 || activeInterim.length > 0;

    // Always render (never unmount) so history survives CC toggle.
    // Hide via CSS when !visible or no content.
    if (!visible || !hasContent) return null;

    return (
        <div className="absolute bottom-12 md:bottom-24 left-1/2 -translate-x-1/2 z-40 w-full max-w-3xl px-4 pointer-events-none flex flex-col items-center">
            {/* Panel: Thêm pointer-events-auto ở đây để lấy lại tương tác chuột, 
              cho phép user scroll nội dung bên trong. 
            */}
            <div
                className={cn(
                    "w-full rounded-2xl overflow-hidden pointer-events-auto",
                    "bg-white/90 dark:bg-zinc-900/90",
                    "border border-zinc-200/60 dark:border-zinc-700/40",
                    "backdrop-blur-xl",
                    "shadow-[0_4px_24px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.45)]"
                )}
            >
                <div
                    ref={containerRef}
                    onScroll={handleScroll}
                    className={cn(
                        "max-h-[35vh] overflow-y-auto",
                        // Hiển thị thanh cuộn mỏng thay vì no-scrollbar
                        "scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent pr-1",
                        // Hiệu ứng fade mờ ở đỉnh và đáy
                        "[mask-image:linear-gradient(to_bottom,transparent,black_5%,black_95%,transparent)]"
                    )}
                >
                    <div className="flex flex-col py-2">
                        {/* Lịch sử chat */}
                        {history.length > 0 && (
                            <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800/70">
                                {history.map((line, idx) => (
                                    <div
                                        key={line.id}
                                        className="flex items-start gap-3 px-4 py-3 transition-opacity"
                                        style={{ opacity: Math.max(0.4, 1 - (history.length - 1 - idx) * 0.1) }}
                                    >
                                        <span className="shrink-0 mt-[6px] w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                                        <div className="flex-1 min-w-0">
                                            <span className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mr-2 font-medium">
                                                {line.name}
                                            </span>
                                            <span className="text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                                                {line.text}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Text đang nói dở */}
                        {activeInterim.length > 0 && (
                            <div
                                className={cn(
                                    "flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800/70",
                                    history.length > 0 && "border-t border-zinc-100 dark:border-zinc-800"
                                )}
                            >
                                {activeInterim.map((entry) => (
                                    <div
                                        key={entry.userId}
                                        className="flex items-start gap-3 px-4 py-3 bg-zinc-50/50 dark:bg-zinc-800/20"
                                    >
                                        <span className="shrink-0 mt-[6px] w-1.5 h-1.5 rounded-full bg-zinc-800 dark:bg-zinc-200 animate-pulse" />
                                        <div className="flex-1 min-w-0">
                                            <span className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mr-2 font-medium">
                                                {entry.name}
                                            </span>
                                            <span className="text-[15px] leading-relaxed text-zinc-900 dark:text-zinc-100">
                                                {entry.text}
                                                <span className="inline-block w-1.5 h-3.5 ml-1.5 align-text-bottom bg-zinc-400 dark:bg-zinc-500 animate-pulse rounded-sm" />
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};