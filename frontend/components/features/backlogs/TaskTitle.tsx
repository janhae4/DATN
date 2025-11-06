import { useEffect, useRef, KeyboardEvent } from "react";
import { Textarea } from "@/components/ui/textarea";

export interface TaskTitleProps {
  title: string;
  onTitleChange: (value: string) => void;
  onBlur: () => void;
}

export function TaskTitle({ title, onTitleChange, onBlur }: TaskTitleProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [title]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  return (
    <Textarea
      ref={textareaRef}
      value={title}
      onChange={(e) => onTitleChange(e.target.value)}
      onBlur={onBlur}
      onKeyDown={handleKeyDown}
      className="min-h-[40px] max-h-[200px] resize-none border-none p-0 text-lg font-medium leading-tight focus-visible:ring-0 focus-visible:ring-offset-0"
      placeholder="Task title"
    />
  );
}
