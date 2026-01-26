import { useState, useEffect, useRef, useCallback } from "react";

interface Rect {
    left: number;
    top: number;
    width: number;
    height: number;
}

const isInteractiveElement = (el: HTMLElement) => {
    return Boolean(
        el.closest(
            `
      button,
      input,
      textarea,
      select,
      option,
      a,
      [role="button"],
      [role="menu"],
      [role="menuitem"],
      [role="combobox"],
      [data-state],
      [data-radix-context-menu-trigger]
      [data-dnd-item]
      `
        )
    );
};

export function useSelectionBox(
    containerRef: React.RefObject<HTMLElement>,
) {
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionRect, setSelectionRect] = useState<Rect | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const startPoint = useRef<{ x: number; y: number } | null>(null);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        if (e.button !== 0) return;
        const target = e.target as HTMLElement;

        if (e.pointerType === "mouse" && e.buttons !== 1) {
            return;
        }

        console.log("POINTER DOWN")

        if (isInteractiveElement(target)) {
            return;
        }

        if (target.closest(".selectable-item")) {
            return;
        }

        setIsSelecting(true);
        const { left, top } = containerRef.current!.getBoundingClientRect();

        const x = e.clientX - left + containerRef.current!.scrollLeft;
        const y = e.clientY - top + containerRef.current!.scrollTop;

        startPoint.current = { x, y };
        setSelectionRect({ left: x, top: y, width: 0, height: 0 });

        if (!e.shiftKey && !e.ctrlKey) {
            setSelectedIds(new Set());
        }
    }, [containerRef]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isSelecting || !startPoint.current || !containerRef.current) return;

        const { left, top } = containerRef.current.getBoundingClientRect();
        const currentX = e.clientX - left + containerRef.current.scrollLeft;
        const currentY = e.clientY - top + containerRef.current.scrollTop;

        const newRect = {
            left: Math.min(currentX, startPoint.current.x),
            top: Math.min(currentY, startPoint.current.y),
            width: Math.abs(currentX - startPoint.current.x),
            height: Math.abs(currentY - startPoint.current.y),
        };

        setSelectionRect(newRect);

        const itemElements = containerRef.current.querySelectorAll(".selectable-item");
        setSelectedIds(prev => {
            const newSelectedIds = new Set(prev);

            itemElements.forEach((el) => {
                const id = el.getAttribute("data-id");
                if (!id) return;

                const elRect = (el as HTMLElement).getBoundingClientRect();
                const containerRect = containerRef.current!.getBoundingClientRect();

                const elLeft = elRect.left - containerRect.left + containerRef.current!.scrollLeft;
                const elTop = elRect.top - containerRect.top + containerRef.current!.scrollTop;

                const isIntersecting = !(
                    newRect.left > elLeft + elRect.width ||
                    newRect.left + newRect.width < elLeft ||
                    newRect.top > elTop + elRect.height ||
                    newRect.top + newRect.height < elTop
                );

                if (isIntersecting) {
                    newSelectedIds.add(id);
                } else if (!e.shiftKey && !e.ctrlKey) {
                }
            });
            return newSelectedIds;
        });
    }, [isSelecting, selectedIds]);

    const handleMouseUp = useCallback(() => {
        setIsSelecting(false);
        setSelectionRect(null);
        startPoint.current = null;
    }, []);

    useEffect(() => {
        if (isSelecting) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        } else {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        }
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isSelecting, handleMouseMove, handleMouseUp]);

    return {
        isSelecting,
        selectionRect,
        handlePointerDown,
        selectedIds,
        setSelectedIds
    };
}