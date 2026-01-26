"use client";

import * as React from "react";
import {
  ExternalLink,
  Download,
  Trash2,
  MoreHorizontal,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  FileText,
  FileSpreadsheet,
  FileArchive,
  Presentation,
  AppWindow,
  FileIcon,
  FolderIcon,
  Lock,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Attachment, AttachmentType, FileVisibility } from "@/types";
import { cn } from "@/lib/utils";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useTeamMembers } from "@/hooks/useTeam";
import { AssigneeDialog } from "@/components/shared/assignee/AsigneeModal";
import { enIE } from "date-fns/locale";

interface FileCardProps {
  file: Attachment;
  projectId?: string;
  teamId?: string;
  onPreview: (file: Attachment) => void;
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
  selectedIds: Set<string>;
  setSelectedIds: (ids: Set<string>) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkDownload?: (ids: string[]) => void;
  onBulkVisibilityChange?: ({
    fileIds,
    visibility,
    allowedUserIds,
  }: {
    fileIds: string[];
    visibility: FileVisibility;
    allowedUserIds?: string[];
  }) => void;
  onVisibilityChange?: (
    fileIds: string[],
    visibility: FileVisibility,
    allowedUserIds?: string[],
  ) => void;
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return "0B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))}${sizes[i]}`;
};

export const getFileTheme = (
  fileType: string = "folder",
  name: string = "",
) => {
  const type = fileType?.toLowerCase() || "";

  const base = {
    image: {
      color: "text-blue-600 dark:text-blue-400",
      fill: "",
      bg: "bg-blue-50 dark:bg-blue-400/10",
      border: "border-blue-100 dark:border-blue-400/20",
      label: "IMG",
      icon: FileImage,
    },
    pdf: {
      color: "text-red-600 dark:text-red-400",
      fill: "",
      bg: "bg-red-50 dark:bg-red-400/10",
      border: "border-red-100 dark:border-red-400/20",
      label: "PDF",
      icon: FileText,
    },
    sheet: {
      color: "text-emerald-600 dark:text-emerald-400",
      fill: "",
      bg: "bg-emerald-50 dark:bg-emerald-400/10",
      border: "border-emerald-100 dark:border-emerald-400/20",
      label: "XLS",
      icon: FileSpreadsheet,
    },
    zip: {
      color: "text-amber-600 dark:text-amber-400",
      fill: "",
      bg: "bg-amber-50 dark:bg-amber-400/10",
      border: "border-amber-100 dark:border-amber-400/20",
      label: "ZIP",
      icon: FileArchive,
    },
    presentation: {
      color: "text-orange-600 dark:text-orange-400",
      fill: "",
      bg: "bg-orange-50 dark:bg-orange-400/10",
      border: "border-orange-100 dark:border-orange-400/20",
      label: "PPT",
      icon: Presentation,
    },
    video: {
      color: "text-pink-600 dark:text-pink-400",
      fill: "",
      bg: "bg-pink-50 dark:bg-pink-400/10",
      border: "border-pink-100 dark:border-pink-400/20",
      label: "VID",
      icon: FileVideo,
    },
    audio: {
      color: "text-purple-600 dark:text-purple-400",
      fill: "",
      bg: "bg-purple-50 dark:bg-purple-400/10",
      border: "border-purple-100 dark:border-purple-400/20",
      label: "AUD",
      icon: FileAudio,
    },
    exe: {
      color: "text-cyan-600 dark:text-cyan-400",
      fill: "",
      bg: "bg-cyan-50 dark:bg-cyan-400/10",
      border: "border-cyan-100 dark:border-cyan-400/20",
      label: "APP",
      icon: AppWindow,
    },
    code: {
      color: "text-indigo-600 dark:text-indigo-400",
      fill: "",
      bg: "bg-indigo-50 dark:bg-indigo-400/10",
      border: "border-indigo-100 dark:border-indigo-400/20",
      label: "CODE",
      icon: FileCode,
    },
    document: {
      color: "text-sky-600 dark:text-sky-400",
      fill: "",
      bg: "bg-sky-50 dark:bg-sky-400/10",
      border: "border-sky-100 dark:border-sky-400/20",
      label: "DOC",
      icon: FileText,
    },
    folder: {
      color: "text-yellow-600 dark:text-yellow-500",
      fill: "fill-yellow-600/20 dark:fill-yellow-500/20",
      bg: "bg-yellow-50 dark:bg-yellow-500/10",
      border: "border-yellow-200 dark:border-yellow-500/20",
      label: "DIR",
      icon: FolderIcon,
    },
    default: {
      color: "text-zinc-500 dark:text-zinc-400",
      fill: "",
      bg: "bg-zinc-50 dark:bg-zinc-400/10",
      border: "border-zinc-200 dark:border-zinc-800",
      label: "FILE",
      icon: FileIcon,
    },
  };

  if (type === "folder" || type === "directory") return base.folder;
  if (type.includes("image")) return base.image;
  if (type.includes("pdf")) return base.pdf;
  if (
    type.includes("spreadsheet") ||
    type.includes("excel") ||
    name.match(/\.(xlsx|xls|csv)$/i)
  )
    return base.sheet;
  if (
    type.includes("presentation") ||
    type.includes("powerpoint") ||
    name.match(/\.(pptx|ppt)$/i)
  )
    return base.presentation;
  if (
    type.includes("zip") ||
    type.includes("compressed") ||
    type.includes("tar") ||
    name.match(/\.(rar|7z)$/i)
  )
    return base.zip;
  if (type.includes("video")) return base.video;
  if (type.includes("audio")) return base.audio;
  if (
    type === "application/x-msdownload" ||
    type.includes("application/octet-stream") ||
    name.match(/\.(exe|msi|dll|bat|cmd|sh|app|dmg)$/i)
  ) {
    return base.exe;
  }
  if (
    type.includes("code") ||
    type.includes("text/javascript") ||
    type.includes("application/json") ||
    name.match(/\.(js|ts|tsx|jsx|json|html|css|py|java|c|cpp|sql)$/i)
  )
    return base.code;
  if (
    type.includes("word") ||
    type.includes("document") ||
    name.match(/\.(docx?|doc|odt|rtf|txt)$/i)
  )
    return base.document;
  return base.default;
};

export const DropdownFileMenuContent = ({
  file,
  projectId,
  teamId,
  currentVisibility,
  onPreview,
  onChangeVisibility,
  setIsAssigneeModalOpen,
  onDownload,
  onDelete,
}: {
  file: Attachment;
  projectId?: string;
  teamId?: string;
  currentVisibility: FileVisibility;
  onPreview: (file: Attachment) => void;
  onChangeVisibility: (
    newVisibility: FileVisibility,
    newAllowedUserIds?: string[],
  ) => void;
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
  setIsAssigneeModalOpen: (open: boolean) => void;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button
        className="p-1.5 focus:opacity-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md text-zinc-500 transition-all duration-150 outline-none opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="min-w-[160px]">
      <DropdownMenuItem
        onClick={(e) => {
          e.stopPropagation();
          onPreview(file);
        }}
      >
        <ExternalLink className="mr-2 h-3.5 w-3.5" /> Open
      </DropdownMenuItem>
      {projectId && teamId && (
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {currentVisibility === FileVisibility.PRIVATE ? (
              <Lock className="mr-2 h-3.5 w-3.5" />
            ) : (
              <Users className="mr-2 h-3.5 w-3.5" />
            )}
            <span>Visibility</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48">
            <DropdownMenuRadioGroup value={currentVisibility}>
              <DropdownMenuRadioItem
                value={FileVisibility.PRIVATE}
                onClick={() => onChangeVisibility(FileVisibility.PRIVATE)}
              >
                <Lock className="mr-2 h-4 w-4 text-zinc-500" />
                <div className="flex flex-col">
                  <span>Private</span>
                  <span className="text-[10px] text-zinc-400">Only you</span>
                </div>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem
                value={FileVisibility.TEAM}
                onClick={() => onChangeVisibility(FileVisibility.TEAM)}
              >
                <Users className="mr-2 h-3.5 w-3.5 text-zinc-500" />{" "}
                <div className="flex flex-col">
                  <span>Team</span>
                  <span className="text-[10px] text-zinc-400">
                    Everyone in team
                  </span>
                </div>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem
                value={FileVisibility.SPECIFIC}
                onClick={() => setIsAssigneeModalOpen(true)}
              >
                <Users className="mr-2 h-3.5 w-3.5 text-zinc-500" />{" "}
                <div className="flex flex-col">
                  <span>Specific</span>
                  <span className="text-[10px] text-zinc-400">
                    Select members...
                  </span>
                </div>
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      )}
      <DropdownMenuItem
        onClick={(e) => {
          e.stopPropagation();
          onDownload(file.id);
        }}
      >
        <Download className="mr-2 h-3.5 w-3.5" /> Download
      </DropdownMenuItem>
      <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
      <DropdownMenuItem
        onClick={(e) => {
          console.log("Remove", file.id);
          onDelete(file.id);
        }}
        className="text-red-600"
      >
        <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export const ContextFileMenuContent = ({
  file,
  selectedIds,
  menuSelectedIds,
  projectId,
  teamId,
  currentVisibility,
  onPreview,
  onChangeVisibility,
  onDownload,
  onDelete,
  setIsAssigneeModalOpen,
  onBulkDownload,
  onBulkDelete,
}: {
  file?: Attachment;
  selectedIds: Set<string>;
  menuSelectedIds: Set<string>;
  projectId?: string;
  teamId?: string;
  currentVisibility: FileVisibility;
  onPreview: (file: Attachment) => void;
  onChangeVisibility: (
    newVisibility: FileVisibility,
    newAllowedUserIds?: string[],
  ) => void;
  onBulkVisibilityChange?: (
    visibility: FileVisibility,
    allowedUserIds?: string[],
  ) => void;
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
  onBulkDownload?: (ids: string[]) => void;
  onBulkDelete?: (ids: string[]) => void;
  setIsAssigneeModalOpen: (open: boolean) => void;
}) => {
  const VisibilitySubMenuContent = () => (
    <>
      <ContextMenuRadioGroup value={currentVisibility}>
        <ContextMenuRadioItem
          value={FileVisibility.PRIVATE}
          onClick={(e) => {
            e.stopPropagation();
            onChangeVisibility(FileVisibility.PRIVATE);
          }}
        >
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-zinc-500" />
            <div className="flex flex-col">
              <span>Private</span>
              <span className="text-[10px] text-zinc-400">Only you</span>
            </div>
          </div>
        </ContextMenuRadioItem>
        <ContextMenuRadioItem
          value={FileVisibility.TEAM}
          onClick={(e) => {
            e.stopPropagation();
            onChangeVisibility(FileVisibility.TEAM);
          }}
        >
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-zinc-500" />
            <div className="flex flex-col">
              <span>Team</span>
              <span className="text-[10px] text-zinc-400">
                Everyone in team
              </span>
            </div>
          </div>
        </ContextMenuRadioItem>
        <ContextMenuRadioItem
          value={FileVisibility.SPECIFIC}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsAssigneeModalOpen(true);
          }}
        >
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-zinc-500" />
            <div className="flex flex-col">
              <span>Specific</span>
              <span className="text-[10px] text-zinc-400">
                Select members...
              </span>
            </div>
          </div>
        </ContextMenuRadioItem>
      </ContextMenuRadioGroup>
    </>
  );

  const isMultiSelect = menuSelectedIds.size > 1;
  const handleDownloadAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTimeout(() => {
      if (isMultiSelect && onBulkDownload) {
        onBulkDownload(Array.from(menuSelectedIds));
      } else {
        const targetId = file?.id || Array.from(selectedIds)[0];
        if (targetId) onDownload(targetId);
      }
    }, 0);
  };

  const handleDeleteAction = () => {
    if (isMultiSelect && onBulkDelete) {
      onBulkDelete(Array.from(menuSelectedIds));
    } else {
      const targetId = file?.id || Array.from(menuSelectedIds)[0];
      if (targetId) onDelete(targetId);
    }
  };

  return (
    <ContextMenuContent className="w-40">
      {!isMultiSelect && (
        <>
          <ContextMenuItem
            onClick={(e) => {
              e.stopPropagation();
              if (file) {
                onPreview(file);
              }
            }}
            className="gap-2"
          >
            <ExternalLink className="h-4 w-4 text-zinc-500" /> Open
          </ContextMenuItem>
          {projectId && teamId && (
            <ContextMenuSub>
              <ContextMenuSubTrigger className="gap-2">
                {currentVisibility === FileVisibility.PRIVATE ? (
                  <Lock className="h-4 w-4 text-zinc-500" />
                ) : (
                  <Users className="h-4 w-4 text-zinc-500" />
                )}
                Visibility
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-48">
                <VisibilitySubMenuContent />
              </ContextMenuSubContent>
            </ContextMenuSub>
          )}
        </>
      )}

      <ContextMenuItem
        onSelect={() => console.log("DELETE", selectedIds)}
        className="gap-2"
      >
        <Download className="h-4 w-4 text-zinc-500" />
        {isMultiSelect ? `Download ${selectedIds.size} files` : "Download"}
      </ContextMenuItem>

      <ContextMenuSeparator />

      <ContextMenuItem
        className="gap-2 text-red-600 focus:text-red-600 focus:bg-red-50"
        onSelect={(e) => {
          e.preventDefault();
          handleDeleteAction();
        }}
      >
        <Trash2 className="h-4 w-4" />
        {isMultiSelect ? `Delete ${selectedIds.size} files` : "Delete"}
      </ContextMenuItem>
    </ContextMenuContent>
  );
};

export const FileCard = ({
  file,
  projectId,
  teamId,
  onPreview,
  onDownload,
  onDelete,
  selectedIds,
  setSelectedIds,
  onBulkDelete,
  onBulkDownload,
  onBulkVisibilityChange,
}: FileCardProps) => {
  const [isAssigneeModalOpen, setIsAssigneeModalOpen] = React.useState(false);
  const { data: members = [] } = useTeamMembers(teamId || null);
  const theme = getFileTheme(file.mimeType, file.fileName);
  const Icon = theme.icon;
  const isFolder = file.fileType === AttachmentType.FOLDER;
  const currentVisibility = file.visibility || FileVisibility.TEAM;
  const currentAllowedUserIds = file.allowedUserIds || [];

  const isSelected = selectedIds?.has(file.id);
  const isMultiSelect = selectedIds?.size > 1 && isSelected;
  const [menuSelectedIds, setMenuSelectedIds] = React.useState<Set<string>>(
    new Set(),
  );
  console.log("Selected count:", selectedIds?.size, isMultiSelect);

  const handleDownloadAction = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isMultiSelect && onBulkDownload) {
      onBulkDownload(Array.from(selectedIds));
    } else {
      onDownload(file.id);
    }
  };

  const handleDeleteAction = () => {
    if (selectedIds.size > 1 && onBulkDelete) {
      onBulkDelete(Array.from(selectedIds));
    } else {
      onDelete(file.id);
    }
  };

  const handleChangeVisibility = (
    newVisibility: FileVisibility,
    newAllowedUserIds?: string[],
  ) => {
    if (!onBulkVisibilityChange) return;
    if (isMultiSelect) {
      onBulkVisibilityChange({
        fileIds: Array.from(selectedIds),
        visibility: newVisibility,
        allowedUserIds: newAllowedUserIds,
      });
    } else {
      onBulkVisibilityChange({
        fileIds: [file.id],
        visibility: newVisibility,
        allowedUserIds: newAllowedUserIds,
      });
    }
  };

  const handleSpecificUsersChange = (userIds: string[]) => {
    handleChangeVisibility(FileVisibility.SPECIFIC, userIds);
  };

  const handleContextMenu = (e: React.MouseEvent) => {

    let targetIds: Set<string>;

    if (isSelected) {
      targetIds = new Set(selectedIds);
    } else {
      targetIds = new Set([file.id]);
      setSelectedIds(targetIds);
    }
    setMenuSelectedIds(targetIds);
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger onContextMenu={handleContextMenu}>
          <div
            className={cn(
              "group relative flex flex-col h-full rounded-xl border transition-all duration-200 select-none",
              isSelected
                ? "bg-blue-50/20 dark:bg-blue-900/20 border-blue-500/50 ring-1 ring-blue-500 z-10"
                : "bg-white dark:bg-[#09090b] border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50/50 hover:border-zinc-300",
            )}
            onPointerDown={(e) => {
              if (e.button === 2) {
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
              }
            }}
          >
            <div className="absolute top-3 right-3 z-20">
              <DropdownFileMenuContent
                key={file.id}
                file={file}
                projectId={projectId}
                teamId={teamId}
                currentVisibility={currentVisibility}
                onPreview={onPreview}
                onChangeVisibility={handleChangeVisibility}
                onDownload={() => handleDownloadAction()}
                onDelete={() => handleDeleteAction()}
                setIsAssigneeModalOpen={setIsAssigneeModalOpen}
              />
            </div>
            <div
              className="flex-1 p-4 flex flex-col gap-4 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onPreview(file);
              }}
            >
              <div className="flex items-start justify-between">
                <div
                  className={`w-10 h-10 flex items-center justify-center rounded-lg border ${theme.bg} ${theme.border}`}
                >
                  <Icon className={`h-5 w-5 ${theme.color}`} />
                </div>
              </div>

              <div className="space-y-1 mt-auto">
                <h3
                  className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate pr-6 leading-tight"
                  title={file.fileName}
                >
                  {file.fileName}
                </h3>

                <div className="flex justify-between items-center text-[11px] text-zinc-500 dark:text-zinc-400 font-medium uppercase tabular-nums">
                  <span>
                    {new Date(file.uploadedAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                  {!isFolder && (
                    <span className="flex items-center gap-1">
                      <span className="w-0.5 h-0.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                      {formatSize(file.fileSize || 0)}
                    </span>
                  )}
                  {isFolder && file.fileSize > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="w-0.5 h-0.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                      {file.fileSize} items
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ContextMenuTrigger>

        <ContextFileMenuContent
          file={file}
          projectId={projectId}
          teamId={teamId}
          menuSelectedIds={menuSelectedIds}
          currentVisibility={currentVisibility}
          onPreview={onPreview}
          onChangeVisibility={handleChangeVisibility}
          onDownload={onDownload}
          onDelete={onDelete}
          setIsAssigneeModalOpen={setIsAssigneeModalOpen}
          selectedIds={selectedIds}
          onBulkDelete={onBulkDelete}
          onBulkDownload={onBulkDownload}
          onBulkVisibilityChange={handleChangeVisibility}
        />
      </ContextMenu>

      <AssigneeDialog
        open={isAssigneeModalOpen}
        onOpenChange={setIsAssigneeModalOpen}
        users={members}
        value={currentAllowedUserIds}
        onChange={handleSpecificUsersChange}
      />
    </>
  );
};
