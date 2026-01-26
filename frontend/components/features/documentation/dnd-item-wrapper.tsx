"use client";

import React from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { Attachment, AttachmentType } from "@/types";

interface DndItemWrapperProps {
  file: Attachment;
  selectedIds: Set<string>;
  activeDragItem: Attachment | null;
  dragOverTargetName: string | null;
  children: React.ReactNode;
  onToggleSelect: (id: string, multiSelect: boolean) => void;
}

export const DndItemWrapper = ({
  file,
  selectedIds,
  activeDragItem,
  children,
  onToggleSelect,
}: DndItemWrapperProps) => {
  const isFolder = file.fileType === AttachmentType.FOLDER;
  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    transform,
    isDragging,
  } = useDraggable({
    id: file.id,
    data: file,
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: file.id,
    data: file,
    disabled: !isFolder || isDragging,
  });

  const setRefs = (node: HTMLElement | null) => {
    setDraggableRef(node);
    setDroppableRef(node);
  };

  const style = {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 999 : "auto",
    touchAction: "none",
  };

  const isDraggingGroup = activeDragItem && selectedIds.has(activeDragItem.id);
  const isPartOfDraggedGroup = isDraggingGroup && selectedIds.has(file.id);
  const shouldHide = isDragging || isPartOfDraggedGroup;

  return (
    <div
      data-dnd-item
      ref={setRefs}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "selectable-item h-full transition-all duration-200 rounded-xl relative",
        shouldHide ? "opacity-0" : "opacity-100",
        isOver && "bg-blue-100 dark:bg-blue-900/40 ring-2 ring-blue-500 z-10",
      )}
      data-id={file.id}
      onClick={(e) => {
        if (isDragging) return;
        onToggleSelect(file.id, e.ctrlKey || e.shiftKey);
      }}
    >
      <style jsx global>{`
        .selectable-item img,
        .selectable-item svg {
          -webkit-user-drag: none;
          user-drag: none;
          pointer-events: none;
        }
      `}</style>

      {children}
    </div>
  );
};
