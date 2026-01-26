import { getFileTheme } from "@/components/features/documentation/file-card";
import { cn } from "@/lib/utils";
import { Attachment } from "@/types";
import { CornerDownRight } from "lucide-react";

export function FileDragPreview({
  file,
  targetFolderName,
}: {
  file: Attachment;
  targetFolderName: string | null;
}) {
  const theme = getFileTheme(file.fileType, file.fileName);
  const Icon = theme.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl cursor-grabbing",
        "bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border-2 border-blue-500/50",
        "animate-in fade-in zoom-in-95 duration-100",
      )}
    >
      {/* Icon File */}
      <div
        className={cn(
          "w-10 h-10 flex items-center justify-center rounded-lg border shrink-0",
          theme.bg,
          theme.border,
        )}
      >
        <Icon className={cn("h-5 w-5", theme.color)} />
      </div>

      <div className="flex flex-col min-w-[120px] max-w-[200px]">
        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
          {file.fileName}
        </p>

        <div
          className={cn(
            "text-[10px] font-medium flex items-center gap-1 mt-0.5",
            targetFolderName
              ? "text-blue-600 dark:text-blue-400"
              : "text-zinc-500",
          )}
        >
          {targetFolderName ? (
            <>
              <CornerDownRight className="h-3 w-3" />
              Move to{" "}
              <span className="font-bold underline">{targetFolderName}</span>
            </>
          ) : (
            "Dragging..."
          )}
        </div>
      </div>
    </div>
  );
}
