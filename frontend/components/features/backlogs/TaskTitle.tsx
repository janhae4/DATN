import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Textarea } from "@/components/ui/textarea";

export interface TaskTitleProps {
  title: string;
  onTitleChange: (value: string) => void;
  onBlur?: () => void;
}

export function TaskTitle({ title, onTitleChange, onBlur }: TaskTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      textareaRef.current.focus();
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
    }
  }, [isEditing]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      setEditedTitle(title);
      setIsEditing(false);
    }
  };

  const handleSave = () => {
    if (editedTitle.trim() !== title) {
      onTitleChange(editedTitle.trim());
    }
    setIsEditing(false);
    onBlur?.();
  };

  const handleClick = () => {
    setEditedTitle(title);
    setIsEditing(true);
  };

  if (!isEditing) {
    return (
      <h2 
        className="min-h-[40px] text-2xl font-medium leading-tight cursor-text hover:bg-accent/50 rounded-sm px-1 -mx-1"
        onClick={handleClick}
      >
        {title || <span className="text-muted-foreground">Add a title...</span>}
      </h2>
    );
  }

  return (
    <Textarea
      ref={textareaRef}
      value={editedTitle}
      onChange={(e) => setEditedTitle(e.target.value)}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      className="min-h-[40px] max-h-[200px] resize-none border-none p-0 !text-2xl font-medium leading-tight focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
      placeholder="Task title"
    />
  );
}
