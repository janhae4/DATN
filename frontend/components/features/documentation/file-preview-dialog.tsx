"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, ExternalLink } from "lucide-react";
import { Attachment } from "@/types";
import FilePreviewContent from "./file-preview-content"; // Import component ở Bước 1

interface FilePreviewDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  file: Attachment | null; // File cần preview (đã có URL)
}

export function FilePreviewDialog({
  isOpen,
  onOpenChange,
  file,
}: FilePreviewDialogProps) {
  if (!file) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden outline-none sm:rounded-lg"
        showCloseButton={false}
      >
        <DialogHeader className="flex flex-row items-center justify-between border-b px-4 py-3 bg-white dark:bg-zinc-950 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <DialogTitle
              className="text-sm font-semibold truncate max-w-[300px] md:max-w-[500px]"
              title={file.fileName}
            >
              {file.fileName}
            </DialogTitle>

            <DialogDescription className="sr-only">
              Preview {file.fileName}
            </DialogDescription>
            <span className="text-xs text-zinc-400 hidden sm:inline-block">
              {file.fileSize
                ? `${(file.fileSize / 1024 / 1024).toFixed(2)} MB`
                : ""}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-500"
              asChild
            >
              <a
                href={file.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Mở tab mới"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-500"
              asChild
            >
              <a href={file.fileUrl} download={file.fileName} title="Tải xuống">
                <Download className="h-4 w-4" />
              </a>
            </Button>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-zinc-500 hover:text-red-600 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        {/* BODY (Render content) */}
        <div className="flex-1 w-full h-full overflow-hidden bg-zinc-100 dark:bg-zinc-900 relative">
          {file.fileUrl ? (
            <FilePreviewContent file={file} />
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-zinc-500">
              Đang tải đường dẫn tập tin...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
