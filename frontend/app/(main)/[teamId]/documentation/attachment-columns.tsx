"use client"

import * as React from "react"
import { ColumnDef, Row } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { 
  Download, 
  Trash, 
  FileText, 
  X, 
  FileImage, 
  FileSpreadsheet, 
  FileArchive, 
  FileVideo, 
  FileAudio, 
  FileCode, 
  Presentation, 
  File as FileIcon, 
  Loader2
} from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useFiles } from "@/hooks/useFiles"
import { Attachment } from "@/types"
import { FilePreviewDialog } from "./file-preview-dialog";

// --- 1. Helper: Lấy Icon đúng định dạng tập tin ---
const getFileIcon = (fileType?: string, fileName?: string) => {
  const type = fileType?.toLowerCase() || '';
  const name = fileName?.toLowerCase() || '';

  if (!type && !name) return <FileIcon className="h-4 w-4 text-gray-400" />;

  if (type.includes('image') || name.match(/\.(png|jpg|jpeg|gif|webp)$/i)) 
    return <FileImage className="h-4 w-4 text-blue-500" />;
  if (type.includes('pdf') || name.endsWith('.pdf')) 
    return <FileText className="h-4 w-4 text-red-500" />;
  if (type.includes('spreadsheet') || type.includes('excel') || name.match(/\.(xlsx?|csv)$/i)) 
    return <FileSpreadsheet className="h-4 w-4 text-emerald-600" />;
  if (type.includes('presentation') || type.includes('powerpoint') || name.match(/\.(pptx?)$/i)) 
    return <Presentation className="h-4 w-4 text-orange-500" />;
  if (type.includes('zip') || type.includes('archive') || name.match(/\.(zip|rar|7z)$/i)) 
    return <FileArchive className="h-4 w-4 text-amber-600" />;
  if (type.includes('video') || name.match(/\.(mp4|mov|avi)$/i)) 
    return <FileVideo className="h-4 w-4 text-pink-500" />;
  if (type.includes('audio') || name.match(/\.(mp3|wav)$/i)) 
    return <FileAudio className="h-4 w-4 text-purple-500" />;
  if (type.includes('code') || name.match(/\.(ts|js|tsx|jsx|json|html|css)$/i))
    return <FileCode className="h-4 w-4 text-indigo-500" />;
  
  // Default file icon
  return <FileIcon className="h-4 w-4 text-gray-500" />;
};

// --- 2. Helper: Format dung lượng ---
const formatBytes = (bytes: number | undefined, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// --- 3. Component: FileNameCell với Icon động ---
const FileNameCell = ({ 
  row, 
  onPreview 
}: { 
  row: Row<Attachment>; 
  onPreview: (file: Attachment) => void 
}) => {
  const { files } = useFiles();
  // Fall back to row.original if file is not found in files array
  const file = files.find(f => f.id === row.original.id) || row.original;
  
  if (!file) return <div className="flex items-center gap-2"><FileIcon className="h-4 w-4 text-gray-400" /> <span className="text-gray-400">Unknown file</span></div>;
  
  const { fileName, fileType } = file;
  const displayName = fileName || 'Untitled file';

  return (
    <div className="flex items-center gap-2 group">
      {getFileIcon(fileType, fileName)}
      <button 
        className="font-medium text-left outline-none hover:underline truncate max-w-[200px]"
        onClick={(e) => {
          e.stopPropagation();
          onPreview(file);
        }}
      >
        {displayName}
      </button>
    </div>
  );
};

// --- 4. Component: ActionCell ---
const ActionCell = ({ 
  row, 
  onDownload, 
  onDelete 
}: { 
  row: Row<Attachment>; 
  onDownload: (file: Attachment) => void;
  onDelete: (file: Attachment) => void;
}) => {
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDownload(row.original);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(row.original);
  };

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-zinc-500"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p className="text-xs">Download</p></TooltipContent>
        </Tooltip>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-zinc-500 hover:text-red-600"
              onClick={(e) => e.stopPropagation()}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the file <strong>{row.original.fileName}</strong>?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                className="bg-red-600" 
                onClick={handleDelete}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TooltipProvider>
    </div>
  );
};

// --- 5. Định nghĩa Columns ---
export const getColumns = ({
  onPreview,
  onDownload,
  onDelete,
}: {
  onPreview: (file: Attachment) => void;
  onDownload: (file: Attachment) => void;
  onDelete: (file: Attachment) => void;
}): ColumnDef<Attachment>[] => [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
            />
        ),
        enableSorting: false,
    },
    {
        accessorKey: "fileName",
        header: "Name",
        cell: ({ row }) => (
          <FileNameCell 
            row={row} 
            onPreview={onPreview} 
          />
        ),
    },
    {
        accessorKey: "fileType",
        header: "Type",
        cell: ({ row }) => {
            const fileType = row.original.fileType?.toLowerCase() || '';
            const fileName = row.original.fileName?.toLowerCase() || '';
            
            // Sử dụng cùng hàm getFileTheme từ FileCard
            const getFileTheme = (type: string, name: string = '') => {
                if (type.includes('image') || name.match(/\.(png|jpg|jpeg|gif|webp)$/)) {
                    return {
                        color: 'text-blue-600 dark:text-blue-400',
                        bg: 'bg-blue-50 dark:bg-blue-400/10',
                        border: 'border-blue-100 dark:border-blue-400/20',
                        label: 'IMG'
                    };
                } else if (type.includes('pdf') || name.endsWith('.pdf')) {
                    return {
                        color: 'text-red-600 dark:text-red-400',
                        bg: 'bg-red-50 dark:bg-red-400/10',
                        border: 'border-red-100 dark:border-red-400/20',
                        label: 'PDF'
                    };
                } else if (type.includes('spreadsheet') || type.includes('excel') || name.match(/\.(xlsx?|csv)$/)) {
                    return {
                        color: 'text-emerald-600 dark:text-emerald-400',
                        bg: 'bg-emerald-50 dark:bg-emerald-400/10',
                        border: 'border-emerald-100 dark:border-emerald-400/20',
                        label: 'XLS'
                    };
                } else if (type.includes('presentation') || type.includes('powerpoint') || name.match(/\.(pptx?)$/)) {
                    return {
                        color: 'text-orange-600 dark:text-orange-400',
                        bg: 'bg-orange-50 dark:bg-orange-400/10',
                        border: 'border-orange-100 dark:border-orange-400/20',
                        label: 'PPT'
                    };
                } else if (type.includes('document') || name.match(/\.(docx?|doc|odt|rtf)$/)) {
                    return {
                        color: 'text-cyan-600 dark:text-cyan-400',
                        bg: 'bg-cyan-50 dark:bg-cyan-400/10',
                        border: 'border-cyan-100 dark:border-cyan-400/20',
                        label: 'DOC'
                    };
                } else if (type.includes('zip') || type.includes('archive') || name.match(/\.(zip|rar|7z)$/)) {
                    return {
                        color: 'text-amber-600 dark:text-amber-400',
                        bg: 'bg-amber-50 dark:bg-amber-400/10',
                        border: 'border-amber-100 dark:border-amber-400/20',
                        label: 'ZIP'
                    };
                } else if (type.includes('video') || name.match(/\.(mp4|mov|avi)$/)) {
                    return {
                        color: 'text-pink-600 dark:text-pink-400',
                        bg: 'bg-pink-50 dark:bg-pink-400/10',
                        border: 'border-pink-100 dark:border-pink-400/20',
                        label: 'VID'
                    };
                } else if (type.includes('audio') || name.match(/\.(mp3|wav)$/)) {
                    return {
                        color: 'text-purple-600 dark:text-purple-400',
                        bg: 'bg-purple-50 dark:bg-purple-400/10',
                        border: 'border-purple-100 dark:border-purple-400/20',
                        label: 'AUD'
                    };
                } else if (type.includes('code') || type.includes('text') || type.includes('javascript') || type.includes('typescript') || name.match(/\.(ts|js|tsx|jsx|json|html|css)$/)) {
                    return {
                        color: 'text-indigo-600 dark:text-indigo-400',
                        bg: 'bg-indigo-50 dark:bg-indigo-400/10',
                        border: 'border-indigo-100 dark:border-indigo-400/20',
                        label: 'CODE'
                    };
                } else {
                    return {
                        color: 'text-zinc-600 dark:text-zinc-400',
                        bg: 'bg-zinc-50 dark:bg-zinc-400/10',
                        border: 'border-zinc-200 dark:border-zinc-700',
                        label: 'FILE'
                    };
                }
            };

            const theme = getFileTheme(fileType, fileName);
            
            return (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${theme.bg} ${theme.color} ${theme.border} tracking-wide`}>
                    {theme.label}
                </span>
            );
        },
    },
    {
        accessorKey: "fileSize",
        header: "Size",
        cell: ({ row }) => <span className="text-xs tabular-nums">{formatBytes(row.original.fileSize)}</span>,
    },
    {
        accessorKey: "uploadedAt",
        header: "Date uploaded",
        cell: ({ row }) => {
            const date = new Date(row.original.uploadedAt);
            return <span className="text-xs text-zinc-500">{date.toLocaleDateString('vi-VN')}</span>;
        },
    },
    {
        id: "actions",
        cell: ({ row }) => (
          <ActionCell 
            row={row} 
            onDownload={onDownload} 
            onDelete={onDelete} 
          />
        ),
    }
];