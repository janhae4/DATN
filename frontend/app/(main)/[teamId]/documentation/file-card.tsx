"use client";

import * as React from "react";
import {
  ExternalLink,
  Download,
  Trash2,
  FileText,
  FileImage,
  FileSpreadsheet,
  FileCode,
  FileArchive,
  FileAudio,
  FileVideo,
  Presentation,
  File as FileIcon,
  Info,
  MoreHorizontal,
  Sparkle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Attachment } from "@/types";

interface FileCardProps {
  file: Attachment;
  onPreview: (file: Attachment) => void;
  onDownload: (file: Attachment) => void;
  onDelete: (file: Attachment) => void;
}

const getFileTheme = (fileType: string, name: string = "") => {
  const type = fileType.toLowerCase();

  const base = {
    image: {
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-400/10",
      border: "border-blue-100 dark:border-blue-400/20",
      label: "IMG",
      icon: FileImage,
    },
    pdf: {
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-400/10",
      border: "border-red-100 dark:border-red-400/20",
      label: "PDF",
      icon: FileText,
    },
    sheet: {
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-400/10",
      border: "border-emerald-100 dark:border-emerald-400/20",
      label: "XLS",
      icon: FileSpreadsheet,
    },
    zip: {
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-400/10",
      border: "border-amber-100 dark:border-amber-400/20",
      label: "ZIP",
      icon: FileArchive,
    },
    presentation: {
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-400/10",
      border: "border-orange-100 dark:border-orange-400/20",
      label: "PPT",
      icon: Presentation,
    },
    video: {
      color: "text-pink-600 dark:text-pink-400",
      bg: "bg-pink-50 dark:bg-pink-400/10",
      border: "border-pink-100 dark:border-pink-400/20",
      label: "VID",
      icon: FileVideo,
    },
    audio: {
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-400/10",
      border: "border-purple-100 dark:border-purple-400/20",
      label: "AUD",
      icon: FileAudio,
    },
    code: {
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-400/10",
      border: "border-indigo-100 dark:border-indigo-400/20",
      label: "CODE",
      icon: FileCode,
    },
    document: {
      color: "text-cyan-600 dark:text-cyan-400",
      bg: "bg-cyan-50 dark:bg-cyan-400/10",
      border: "border-cyan-100 dark:border-cyan-400/20",
      label: "DOC",
      icon: FileText,
    },
    default: {
      color: "text-zinc-500 dark:text-zinc-400",
      bg: "bg-zinc-50 dark:bg-zinc-400/10",
      border: "border-zinc-200 dark:border-zinc-800",
      label: "FILE",
      icon: FileIcon,
    },
  };

  if (type.includes("image")) return base.image;
  if (type.includes("pdf")) return base.pdf;
  if (type.includes("spreadsheet") || type.includes("excel")) return base.sheet;
  if (type.includes("presentation") || type.includes("powerpoint"))
    return base.presentation;
  if (type.includes("zip") || type.includes("compressed")) return base.zip;
  if (type.includes("video")) return base.video;
  if (type.includes("audio")) return base.audio;
  if (
    type.includes("code") ||
    type.includes("text") ||
    type.includes("javascript") ||
    type.includes("typescript")
  )
    return base.code;
  if (type.includes("document") || name.match(/\.(docx?|doc|odt|rtf)$/))
    return base.document;

  return base.default;
};

const formatSize = (bytes: number) => {
  if (bytes === 0) return "0B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))}${sizes[i]}`;
};

export const FileCard = ({
  file,
  onPreview,
  onDownload,
  onDelete,
}: FileCardProps) => {
  const theme = getFileTheme(file.fileType, file.fileName);
  const Icon = theme.icon;

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPreview(file);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDownload(file);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(file);
  };

  return (
    <div className="group relative flex flex-col bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl transition-colors duration-200 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700">
      {/* Menu Action */}
      <div className="absolute top-3 right-3 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 focus:opacity-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md text-zinc-500 transition-all duration-150 outline-none">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="min-w-[160px] rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] shadow-xl shadow-zinc-200/20 dark:shadow-none"
          >
            <DropdownMenuItem
              onClick={handlePreview}
              className="text-xs py-2 cursor-pointer gap-2"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Preview
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDownload}
              className="text-xs py-2 cursor-pointer gap-2"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs py-2 cursor-pointer gap-2 text-zinc-500">
              <Info className="h-3.5 w-3.5" /> Info
            </DropdownMenuItem>
            <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-xs py-2 cursor-pointer gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Content */}
      <div
        className="p-4 flex flex-col gap-4 cursor-pointer"
        onClick={handlePreview}
      >
        {/* Header: Icon & Label */}
        <div className="flex items-start justify-between">
          <div
            className={`w-10 h-10 flex items-center justify-center rounded-lg border ${theme.bg} ${theme.border}`}
          >
            {/* Render Icon động dựa theo theme */}
            <Icon className={`h-5 w-5 stroke-[1.5px] ${theme.color}`} />
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-1">
          <h3
            className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate pr-6 leading-tight"
            title={file.fileName}
          >
            {file.fileName}
          </h3>

          <div className="flex justify-between ">
            <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium uppercase tabular-nums tracking-tight">
              <span>
                {new Date(file.uploadedAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                })}
              </span>
              <span className="w-0.5 h-0.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              <span>{formatSize(file.fileSize || 0)}</span>
            </div>

            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${theme.bg} ${theme.color} ${theme.border} tracking-wide`}
            >
              {theme.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
