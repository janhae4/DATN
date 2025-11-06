import { KeyboardEvent } from "react";
import { Textarea } from "@/components/ui/textarea";

export interface TaskDescriptionProps {
  description: string;
  onDescriptionChange: (value: string) => void;
  onBlur: () => void;
}

export function TaskDescription({ 
  description, 
  onDescriptionChange, 
  onBlur 
}: TaskDescriptionProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.ctrlKey) {
      e.currentTarget.blur();
    }
  };

  return (
    <Textarea
      value={description}
      onChange={(e) => onDescriptionChange(e.target.value)}
      onBlur={onBlur}
      onKeyDown={handleKeyDown}
      className="min-h-[100px] resize-none"
      placeholder="Add a description..."
    />
  );
}
