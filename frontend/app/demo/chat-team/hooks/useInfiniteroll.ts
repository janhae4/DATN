import { useEffect, useRef } from "react";
function throttle<T extends (...args: any[]) => void>(func: T, limit: number): T {
    let inThrottle = false;
    return function (this: any, ...args: any[]) {
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    } as T;
}

interface UseInfiniteScrollProps {
    containerRef: React.RefObject<HTMLDivElement | null>;
    endRef: React.RefObject<HTMLDivElement | null>;
    loadOlder: () => void;
    count: number;
    isLoadingOlder: boolean;
    loadDirection?: 'top' | 'bottom';
    threshold?: number;
    throttleMs?: number;
}

export function useInfiniteScroll({
    containerRef,
    endRef,
    loadOlder,
    count,
    isLoadingOlder,
    loadDirection = 'top',
    throttleMs = 200,
    threshold = 50
}: UseInfiniteScrollProps) {
    const isScrolledToBottomRef = useRef(false);
    const container = containerRef.current;
    if (container && loadDirection === 'top') {
        const scrollThreshold = threshold + 50;
        isScrolledToBottomRef.current =
            container.scrollHeight - container.scrollTop - container.clientHeight < scrollThreshold;
    }

    useEffect(() => {
        if (isLoadingOlder || !endRef.current) return;

        const container = containerRef.current;
        if (!container) return;

        if (loadDirection === 'top') {
            if (isScrolledToBottomRef.current) {
                setTimeout(() => {
                    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
                }, 100);
            }
        }
    }, [count, containerRef, endRef, isLoadingOlder, threshold, loadDirection]); // <-- **FIX 1: Thêm loadDirection vào đây**

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = throttle(() => {
            if (isLoadingOlder) return;

            if (loadDirection === 'top') {
                if (container.scrollTop < threshold + 200) {
                    loadOlder();
                }
            } else {
                const isNearBottom =
                    container.scrollHeight - container.scrollTop - container.clientHeight < threshold;

                if (isNearBottom) {
                    loadOlder();
                }
            }
        }, throttleMs);

        container.addEventListener('scroll', handleScroll);

        return () => {
            container.removeEventListener('scroll', handleScroll);
        };
    }, [containerRef, loadOlder, isLoadingOlder, loadDirection, threshold, throttleMs]);
}