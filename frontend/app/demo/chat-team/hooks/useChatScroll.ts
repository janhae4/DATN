import { useEffect } from "react";

function throttle<T extends (...args: any[]) => void>(func: T, limit: number): T {
    let inThrottle: boolean;
    let lastFunc: ReturnType<typeof setTimeout>;
    let lastTime: number;
    return function (this: any, ...args: any[]) {
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            lastTime = Date.now();
            inThrottle = true;
        } else {
            clearTimeout(lastFunc);
            lastFunc = setTimeout(() => {
                if (Date.now() - lastTime >= limit) {
                    func.apply(context, args);
                    lastTime = Date.now();
                }
            }, Math.max(limit - (Date.now() - lastTime), 0));
        }
    } as T;
}

interface UseChatScrollProps {
    chatContainerRef: React.RefObject<HTMLDivElement | null>;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    loadOlderMessages: () => void;
    messageCount: number;
    isLoadingOlderMessages: boolean;
}

export function useChatScroll({
    chatContainerRef,
    messagesEndRef,
    loadOlderMessages,
    messageCount,
    isLoadingOlderMessages
}: UseChatScrollProps) {

    useEffect(() => {
        if (isLoadingOlderMessages) return;

        const container = chatContainerRef.current;
        if (!container) return;

        const scrollThreshold = 100;
        const isScrolledToBottom =
            container.scrollHeight - container.scrollTop - container.clientHeight < scrollThreshold;

        if (isScrolledToBottom) {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
            }, 100);
        }
    }, [messageCount, chatContainerRef, messagesEndRef, isLoadingOlderMessages]);

    useEffect(() => {
        const container = chatContainerRef.current;
        if (!container) return;

        const handleScroll = throttle(() => {
            if (container.scrollTop < 50 && !isLoadingOlderMessages) {
                loadOlderMessages();
            }
        }, 200);

        container.addEventListener('scroll', handleScroll);

        return () => {
            container.removeEventListener('scroll', handleScroll);
        };
    }, [chatContainerRef, loadOlderMessages, isLoadingOlderMessages]);
}

