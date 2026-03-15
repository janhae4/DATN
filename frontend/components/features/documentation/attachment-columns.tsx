"use client";

import * as React from "react";
import { ColumnDef, Row } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Download, Trash, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Attachment, AttachmentType, FileVisibility, Member } from "@/types";
import { DropdownFileMenuContent, getFileTheme } from "./file-card";
import { AssigneeDialog } from "@/components/shared/assignee/AsigneeModal";
const formatBytes = (bytes: number | undefined, decimals = 2) => {
  if (bytes === 0 || !bytes) return "0B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const FileNameCell = ({
  row,
  onPreview,
}: {
  row: Row<Attachment>;
  onPreview: (file: Attachment) => void;
}) => {
  const file = row.original;

  const theme = getFileTheme(file.mimeType, file.fileName);
  const Icon = theme.icon;
  return (
    <div
      className="flex items-center gap-3 group cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        onPreview(file);
      }}
    >
      <div
        className={`
        flex items-center justify-center w-8 h-8 rounded-lg border transition-colors shrink-0
        ${theme.bg} ${theme.border}
      `}
      >
        <Icon
          className={`
          h-4 w-4 stroke-[1.5px] 
          ${theme.color} 
        `}
        />
      </div>

      <div className="flex flex-col min-w-0">
        <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate max-w-[200px] sm:max-w-[300px] hover:underline hover:text-blue-600">
          {file.fileName || "Untitled file"}
        </span>
      </div>
    </div>
  );
};

const ActionCell = ({
  row,
  onDownload,
  onDelete,
  onPreview,
  projectId,
  teamId,
  onVisibilityChange,
  members,
}: {
  row: Row<Attachment>;
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
  onPreview: (file: Attachment) => void;
  onVisibilityChange: (
    fileIds: string[],
    visibility: FileVisibility,
    allowedUserIds?: string[],
  ) => void;
  members: Member[];
  projectId?: string;
  teamId?: string;
}) => {
  const file = row.original;

  const [isAssigneeModalOpen, setIsAssigneeModalOpen] = React.useState(false);
  const handleChangeVisibility = (
    newVisibility: FileVisibility,
    newAllowedUserIds?: string[],
  ) => {
    onVisibilityChange([file.id], newVisibility, newAllowedUserIds);
  };

  return (
    <div
      className="flex items-center justify-end"
      onClick={(e) => e.stopPropagation()}
    >
      <DropdownFileMenuContent
        file={file}
        projectId={projectId}
        teamId={teamId}
        currentVisibility={file.visibility}
        onPreview={onPreview}
        onDownload={onDownload}
        onDelete={onDelete}
        onChangeVisibility={handleChangeVisibility}
        setIsAssigneeModalOpen={setIsAssigneeModalOpen}
      />

      <AssigneeDialog
        open={isAssigneeModalOpen}
        onOpenChange={setIsAssigneeModalOpen}
        users={members}
        value={file.allowedUserIds || []}
        onChange={(userIds) =>
          handleChangeVisibility(FileVisibility.SPECIFIC, userIds)
        }
      />
    </div>
  );
};

export const getColumns = ({
  onPreview,
  onDownload,
  onDelete,
  onVisibilityChange,
  members,
  projectId,
  teamId,
}: {
  onPreview: (file: Attachment) => void;
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
  onVisibilityChange: (
    fileIds: string[],
    visibility: FileVisibility,
    allowedUserIds?: string[],
  ) => void;
  members: Member[];
  projectId?: string;
  teamId?: string;
}): ColumnDef<Attachment>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  },
  {
    accessorKey: "fileName",
    header: "Name",
    cell: ({ row }) => <FileNameCell row={row} onPreview={onPreview} />,
    size: 400,
  },
  {
    accessorKey: "fileSize",
    header: "Size",
    cell: ({ row }) => {
      const isFolder = row.original.fileType === AttachmentType.FOLDER;
      if (isFolder) return <span className="text-zinc-400 text-xs">--</span>;

      return (
        <span className="text-sm text-zinc-500 tabular-nums">
          {formatBytes(row.original.fileSize)}
        </span>
      );
    },
    size: 100,
  },
  {
    accessorKey: "uploadedAt",
    header: "Date Modified",
    cell: ({ row }) => {
      const date = new Date(row.original.uploadedAt);
      return (
        <span className="text-sm text-zinc-500 whitespace-nowrap">
          {date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      );
    },
    size: 150,
  },
  {
    accessorKey: "fileType",
    header: "Type",
    cell: ({ row }) => {
      const theme = getFileTheme(row.original.fileType, row.original.fileName);
      return (
        <span
          className={`
            inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold border min-w-[40px]
            ${theme.bg} ${theme.color} ${theme.border} tracking-wide
          `}
        >
          {theme.label}
        </span>
      );
    },
    size: 100,
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <ActionCell
        row={row}
        onDownload={onDownload}
        onDelete={onDelete}
        onPreview={onPreview}
        onVisibilityChange={onVisibilityChange}
        members={members}
        projectId={projectId}
        teamId={teamId}
      />
    ),
    size: 50,
  },
];
