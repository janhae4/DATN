"use client";

import * as React from "react";
import { useRef, useState, useCallback, useMemo } from "react";
import { FilePreviewDialog } from "@/components/features/documentation/file-preview-dialog";
import {
  LayoutGrid,
  Table2,
  UploadCloud,
  X,
  Search,
  Loader2,
  HelpCircle,
  Home,
  ChevronRight,
  CornerLeftUp,
  FolderPlus,
  FileIcon,
  ChevronUp,
  ChevronDown,
  Check,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FileCard } from "@/components/features/documentation/file-card";
import { useFiles } from "@/hooks/useFiles";
import { Attachment, AttachmentType } from "@/types";

import { useParams } from "next/navigation";
import { useProjects } from "@/hooks/useProjects";
import { useDocumentationTour } from "@/hooks/touring/useDocumentationTour";
import { CreateFolderDialog } from "./create-folder-dialog";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { createPortal } from "react-dom";
import { FileDragPreview } from "./file-row-preview";
import { Progress } from "@/components/ui/progress";
import { useSelectionBox } from "@/hooks/useSelectionBox";
import { DndItemWrapper } from "@/components/features/documentation/dnd-item-wrapper";

interface StagedFile {
  file: File;
  status: "waiting" | "uploading" | "success" | "error";
  id?: string;
  progress: number;
  signal: AbortSignal;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const DroppableBreadcrumbItem = ({
  id,
  name,
  isCurrent,
  onClick,
  isRoot = false,
}: {
  id: string | null;
  name: string;
  isCurrent: boolean;
  onClick: () => void;
  isRoot?: boolean;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: isRoot ? "root-breadcrumb" : `breadcrumb-${id}`,
    disabled: isCurrent,
    data: {
      fileType: AttachmentType.FOLDER,
      id: id,
      fileName: name,
    },
  });

  return (
    <div className="relative flex items-center">
      <button
        ref={setNodeRef}
        onClick={onClick}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-md text-sm transition-all whitespace-nowrap",
          isOver
            ? "bg-zinc-200 dark:bg-zinc-800"
            : "hover:bg-zinc-100 dark:hover:bg-zinc-800",
          isCurrent
            ? "font-semibold text-zinc-900 dark:text-zinc-100 cursor-default"
            : "text-zinc-500 cursor-pointer",
        )}
      >
        {isRoot && <Home className="h-3.5 w-3.5" />}
        <span>{name}</span>
      </button>
    </div>
  );
};

export default function AttachmentPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const { projects } = useProjects(teamId);
  const { startTour } = useDocumentationTour();
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<
    { id: string; name: string }[]
  >([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hiddenFileIds, setHiddenFileIds] = useState<string[]>([]);

  const handleCreateFolder = async (name: string) => {
    await createFolder(name);
  };

  const handleNavigateUp = () => {
    if (breadcrumbs.length === 0) return;
    const newBreadcrumbs = breadcrumbs.slice(0, -1);
    const parentFolder =
      newBreadcrumbs.length > 0
        ? newBreadcrumbs[newBreadcrumbs.length - 1].id
        : null;

    setBreadcrumbs(newBreadcrumbs);
    setCurrentFolderId(parentFolder);
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      setCurrentFolderId(null);
      setBreadcrumbs([]);
      return;
    }
    const target = breadcrumbs[index];
    setCurrentFolderId(target.id);
    setBreadcrumbs((prev) => prev.slice(0, index + 1));
  };

  const [paginationState, setPaginationState] = useState({
    pageIndex: 0,
    pageSize: 12,
  });
  const [fileNameFilter, setFileNameFilter] = useState("");

  const {
    files,
    uploadFile,
    deleteFile,
    downloadFile,
    previewFile,
    createFolder,
    moveFilesToFolder,
    deleteFiles,
    downloadFiles,
    changeVisibility,
    pagination,
    isLoading,
  } = useFiles(
    selectedProjectId,
    teamId,
    paginationState.pageIndex + 1,
    paginationState.pageSize,
    currentFolderId,
  );

  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOverTargetName, setDragOverTargetName] = useState<string | null>(
    null,
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    isSelecting,
    selectionRect,
    handlePointerDown,
    selectedIds,
    setSelectedIds,
  } = useSelectionBox(containerRef as React.RefObject<HTMLElement>);

  React.useEffect(() => {
    setHiddenFileIds([]);
    setSelectedIds(new Set());
  }, [currentFolderId, selectedProjectId]);

  const handleToggleSelect = (id: string, multiSelect: boolean) => {
    if (multiSelect) {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedIds(newSet);
    } else {
      setSelectedIds(new Set([id]));
    }
  };

  const handleDndDragOver = (event: DragOverEvent) => {
    const { over } = event;

    if (over && over.data?.current?.fileName) {
      setDragOverTargetName(over.data.current.fileName);
    } else {
      setDragOverTargetName(null);
    }
  };

  const handleNativeDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const rawFiles = Array.from(e.dataTransfer.files);

    if (rawFiles.length > 0) {
      const newStagedItems: StagedFile[] = rawFiles.map((file) => ({
        file: file,
        status: "waiting",
        id: crypto.randomUUID(),
        progress: 0,
        signal: new AbortController().signal,
      }));

      setStagedFiles((prev) => {
        const uniqueNewItems = newStagedItems.filter(
          (newItem) =>
            !prev.some(
              (existingItem) => existingItem.file.name === newItem.file.name,
            ),
        );

        return [...prev, ...uniqueNewItems];
      });
    }
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
  );
  const [isDndDragging, setIsDndDragging] = useState(false);
  const [activeDragItem, setActiveDragItem] = useState<Attachment | null>(null);
  const handleDragStart = (event: any) => {
    console.log("event", event);
    setIsDndDragging(true);
    setActiveDragItem(event.active.data.current as Attachment);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setDragOverTargetName(null);
    setActiveDragItem(null);

    if (!over || active.id === over.id) return;

    const draggedFileId = active.id as string;
    const targetFolder = over.data.current as Attachment;

    const isTargetFolder = targetFolder.fileType === "FOLDER";

    if (isTargetFolder) {
      let idsToMove: string[] = [];

      if (selectedIds.has(draggedFileId)) {
        idsToMove = Array.from(selectedIds);
      } else {
        idsToMove = [draggedFileId];
      }

      setHiddenFileIds((prev) => [...prev, ...idsToMove]);

      console.log(
        `Moving ${idsToMove.length} files into folder ${targetFolder.fileName}`,
      );

      try {
        await moveFilesToFolder({
          fileIds: idsToMove,
          parentId: targetFolder.id,
        });

        setSelectedIds(new Set());
      } catch (e) {
        setHiddenFileIds((prev) =>
          prev.filter((id) => !idsToMove.includes(id)),
        );
        toast.error("Failed to move files");
      }
    }

    setIsDndDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = Array.from(e.target.files || []);
    if (rawFiles.length === 0) return;

    const newStagedFiles: StagedFile[] = rawFiles.map((file) => ({
      file: file,
      status: "waiting",
      id: crypto.randomUUID(),
      progress: 0,
      signal: new AbortController().signal,
    }));

    setStagedFiles((prev) => {
      const uniqueFiles = newStagedFiles.filter(
        (newItem) =>
          !prev.some(
            (existingItem) => existingItem.file.name === newItem.file.name,
          ),
      );

      return [...prev, ...uniqueFiles];
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeStagedFile = (fileName: string) => {
    setStagedFiles((prev) => prev.filter((f) => f.file.name !== fileName));
  };

  const abortControllers = useRef<Record<string, AbortController>>({});
  const handleUpload = async () => {
    setIsUploading(true);

    setStagedFiles((prev) =>
      prev.map((item) => ({
        ...item,
        status: item.status === "success" ? "success" : "uploading",
        progress: 0,
      })),
    );

    const uploadPromises = stagedFiles.map(async (stagedItem) => {
      if (stagedItem.status === "success") return;
      const controller = new AbortController();
      abortControllers.current[stagedItem.id as string] = controller;
      try {
        (await uploadFile({
          file: stagedItem.file,
          onProgress: (percent) => {
            setStagedFiles((prev) =>
              prev.map((item) =>
                item.id === stagedItem.id
                  ? { ...item, progress: percent }
                  : item,
              ),
            );
          },
          signal: controller.signal,
        }),
          setStagedFiles((prev) =>
            prev.map((item) =>
              item.id === stagedItem.id
                ? { ...item, status: "success", progress: 100 }
                : item,
            ),
          ));
      } catch (e: any) {
        const isCanceled = e.message === "Canceled";
        setStagedFiles((prev) =>
          prev.map((item) =>
            item.id === stagedItem.id
              ? {
                  ...item,
                  status: isCanceled ? "waiting" : "error",
                  progress: 0,
                }
              : item,
          ),
        );
      } finally {
        delete abortControllers.current[stagedItem.id as string];
      }
    });

    await Promise.allSettled(uploadPromises);
    setIsUploading(false);

    setTimeout(() => {
      setStagedFiles((prev) => prev.filter((f) => f.status !== "success"));
    }, 3000);
  };

  const handleCancelUpload = (fileId: string) => {
    const controller = abortControllers.current[fileId];
    if (controller) {
      controller.abort();
    } else {
      setStagedFiles((prev) => prev.filter((f) => f.id !== fileId));
    }
  };

  const [previewData, setPreviewData] = React.useState<Attachment | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const handleItemClick = async (item: Attachment) => {
    console.log("item", item);
    const isFolder = item.fileType === AttachmentType.FOLDER;

    if (isFolder) {
      setCurrentFolderId(item.id);
      setBreadcrumbs((prev) => [...prev, { id: item.id, name: item.fileName }]);
      setPaginationState((prev) => ({ ...prev, pageIndex: 0 }));
    } else {
      handlePreview(item);
    }
  };
  const handlePreview = async (file: Attachment) => {
    try {
      const url = await previewFile(file.id);
      if (url) {
        setPreviewData({ ...file, fileUrl: url });
        setIsPreviewOpen(true);
      }
    } catch (e) {
      toast.error("Failed to open file");
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden relative rounded-lg bg-white/50 dark:bg-zinc-900/20 select-none"
      onDragOver={handleNativeDragOver}
      onPointerDown={handlePointerDown}
      onDrop={handleDrop}
    >
      {isSelecting && selectionRect && (
        <div
          className="absolute z-50 border border-blue-500 bg-blue-500/20 pointer-events-none"
          style={{
            left: selectionRect.left,
            top: selectionRect.top,
            width: selectionRect.width,
            height: selectionRect.height,
          }}
        />
      )}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDndDragOver}
      >
        <div className="container mx-auto h-[calc(100vh-40px)] flex flex-col">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4 pt-4">
            <div className="space-y-0.5">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                File Explorer
                <HelpCircle
                  className="h-4 w-4 text-zinc-400 cursor-pointer hover:text-zinc-600"
                  onClick={startTour}
                />
              </h1>
              <p className="text-xs text-zinc-500 font-medium">
                Manage assets for{" "}
                {selectedProjectId
                  ? projects?.find((p) => p.id === selectedProjectId)?.name
                  : "All Projects"}
              </p>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Select
                value={selectedProjectId}
                onValueChange={(val) => {
                  if (val === "unassigned") {
                    setSelectedProjectId("");
                  } else {
                    setSelectedProjectId(val);
                  }

                  setCurrentFolderId(null);
                  setBreadcrumbs([]);
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Personal Files</SelectItem>
                  {projects?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                multiple
              />
              <Button
                variant="default"
                onClick={() => {
                  if (fileInputRef.current) fileInputRef.current.click();
                }}
                className="gap-2"
              >
                <UploadCloud className="h-4 w-4" />
                <span className="hidden sm:inline">Upload</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => setIsCreateFolderOpen(true)}
                className="gap-2 hidden sm:flex"
              >
                <FolderPlus className="h-4 w-4" />
                <span>New Folder</span>
              </Button>
            </div>
          </div>

          <div className="bg-zinc-50/80 dark:bg-zinc-900/50 border rounded-lg p-2 mb-4 flex flex-col sm:flex-row gap-3 items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
            <div className="flex items-center gap-2 flex-1 w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950 rounded-md px-2 h-10">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                disabled={breadcrumbs.length === 0}
                onClick={handleNavigateUp}
                title="Go to parent folder"
              >
                <CornerLeftUp className="h-4 w-4 text-zinc-500" />
              </Button>

              <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 shrink-0 mx-1" />

              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar mask-gradient-right flex-1">
                <DroppableBreadcrumbItem
                  id={null}
                  name="Home"
                  isRoot={true}
                  isCurrent={breadcrumbs.length === 0}
                  onClick={() => handleBreadcrumbClick(-1)}
                />

                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={crumb.id}>
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-300 shrink-0" />
                    <DroppableBreadcrumbItem
                      id={crumb.id}
                      name={crumb.name}
                      isCurrent={index === breadcrumbs.length - 1}
                      onClick={() => handleBreadcrumbClick(index)}
                    />
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-[180px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                <Input
                  placeholder="Search"
                  value={fileNameFilter}
                  onChange={(e) => setFileNameFilter(e.target.value)}
                  className="pl-8 h-9 text-xs"
                />
              </div>
            </div>
          </div>

          {stagedFiles.length > 0 && (
            <div
              className={cn(
                "fixed bottom-10 right-6 z-50 w-96 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg flex flex-col overflow-hidden transition-all duration-300 ease-in-out",
                isMinimized ? "h-12" : "max-h-[80vh]",
              )}
            >
              <div
                className="bg-zinc-900 text-zinc-50 dark:bg-zinc-800 px-4 h-12 flex items-center justify-between cursor-pointer select-none"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                <div className="flex items-center gap-2">
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                  ) : (
                    <span className="text-sm font-medium">
                      {stagedFiles.length} uploads ready
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-zinc-400 hover:text-white hover:bg-zinc-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMinimized(!isMinimized);
                    }}
                  >
                    {isMinimized ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-zinc-400 hover:text-white hover:bg-zinc-700"
                    disabled={isUploading}
                    onClick={(e) => {
                      e.stopPropagation();
                      setStagedFiles([]);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-950">
                <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {stagedFiles.map((stagedFile, i) => (
                    <li
                      key={stagedFile.id || i}
                      className="flex items-center gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 group border-b last:border-0 border-zinc-100 dark:border-zinc-800 transition-colors"
                    >
                      <div className="h-10 w-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 text-zinc-500">
                        <FileIcon className="h-5 w-5" />
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate pr-2">
                            {stagedFile.file.name}
                          </p>

                          <span className="text-xs text-zinc-400 shrink-0 font-mono">
                            {stagedFile.status === "uploading"
                              ? `${stagedFile.progress}%`
                              : formatFileSize(stagedFile.file.size)}
                          </span>
                        </div>

                        {stagedFile.status === "uploading" ? (
                          <Progress
                            value={stagedFile.progress}
                            className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800"
                          />
                        ) : (
                          <div className="flex items-center gap-1.5 h-1.5">
                            {stagedFile.status === "error" && (
                              <span className="text-xs text-red-500 flex items-center gap-1">
                                Upload failed
                              </span>
                            )}
                            {stagedFile.status === "success" && (
                              <span className="text-xs text-green-500 flex items-center gap-1">
                                Completed
                              </span>
                            )}
                            {stagedFile.status === "waiting" && (
                              <span className="text-xs text-zinc-400">
                                Ready to upload
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 flex items-center gap-1">
                        {stagedFile.status === "uploading" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() =>
                              handleCancelUpload(stagedFile.id as string)
                            }
                            title="Cancel upload"
                          >
                            <Square className="h-3.5 w-3.5 fill-current" />
                          </Button>
                        )}

                        {(stagedFile.status === "waiting" ||
                          stagedFile.status === "error") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                            onClick={() =>
                              handleCancelUpload(stagedFile.id as string)
                            }
                            title="Remove file"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}

                        {stagedFile.status === "success" && (
                          <div className="h-8 w-8 flex items-center justify-center">
                            <Check className="h-5 w-5 text-green-500" />
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 border-t bg-zinc-50 dark:bg-zinc-900 flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStagedFiles([])}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleUpload}
                  disabled={
                    isUploading ||
                    stagedFiles.length === 0 ||
                    stagedFiles.every((item) => item.status === "success")
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : (
                    "Start Upload"
                  )}
                </Button>
              </div>
            </div>
          )}

          <div
            className="flex-1 overflow-hidden relative rounded-lg bg-white/50 dark:bg-zinc-900/20"
            onDragOver={handleNativeDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isDragging && (
              <div className="absolute inset-0 z-50 bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-lg flex flex-col items-center justify-center backdrop-blur-[1px]">
                <div className="bg-white dark:bg-zinc-900 p-4 rounded-full shadow-lg mb-4">
                  <UploadCloud className="h-10 w-10 text-blue-800" />
                </div>
                <h3 className="text-xl font-bold text-blue-800 dark:text-blue-400">
                  Drop files here to upload
                </h3>
                <p className="text-zinc-500">
                  {breadcrumbs.length > 0
                    ? breadcrumbs[breadcrumbs.length - 1].name
                    : "Home folder"}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
              {files.map((file) => {
                return (
                  <DndItemWrapper
                    key={file.id}
                    activeDragItem={activeDragItem}
                    dragOverTargetName={dragOverTargetName}
                    file={file}
                    onToggleSelect={handleToggleSelect}
                    selectedIds={selectedIds}
                  >
                    <FileCard
                      file={file}
                      projectId={selectedProjectId}
                      teamId={teamId}
                      onPreview={handleItemClick}
                      onDownload={(f) => downloadFile(f)}
                      onDelete={(f) => deleteFile(f)}
                      selectedIds={selectedIds}
                      setSelectedIds={setSelectedIds}
                      onBulkDelete={deleteFiles}
                      onBulkDownload={downloadFiles}
                      onBulkVisibilityChange={changeVisibility}
                    />
                  </DndItemWrapper>
                );
              })}
            </div>
            {createPortal(
              <DragOverlay dropAnimation={activeDragItem ? null : undefined}>
                {activeDragItem ? (
                  <div className="pointer-events-none">
                    {selectedIds.has(activeDragItem.id) &&
                    selectedIds.size > 1 ? (
                      <div className="relative">
                        <FileDragPreview
                          file={activeDragItem}
                          targetFolderName={dragOverTargetName}
                        />
                        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-md">
                          +{selectedIds.size - 1}
                        </div>
                      </div>
                    ) : (
                      <FileDragPreview
                        file={activeDragItem}
                        targetFolderName={dragOverTargetName}
                      />
                    )}
                  </div>
                ) : null}
              </DragOverlay>,
              document.body,
            )}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm flex items-center justify-between shrink-0">
              <div className="text-sm text-zinc-500 font-medium">
                Page {paginationState.pageIndex + 1} of{" "}
                {pagination?.totalPages || 1}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPaginationState((prev) => ({
                      ...prev,
                      pageIndex: Math.max(0, prev.pageIndex - 1),
                    }))
                  }
                  disabled={paginationState.pageIndex === 0 || isLoading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPaginationState((prev) => ({
                      ...prev,
                      pageIndex: prev.pageIndex + 1,
                    }))
                  }
                  disabled={
                    paginationState.pageIndex + 1 >=
                      (pagination?.totalPages || 1) || isLoading
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </div>

          <CreateFolderDialog
            isOpen={isCreateFolderOpen}
            onOpenChange={setIsCreateFolderOpen}
            parentId={currentFolderId}
            onCreate={handleCreateFolder}
          />
          <FilePreviewDialog
            isOpen={isPreviewOpen}
            onOpenChange={setIsPreviewOpen}
            file={previewData}
          />
        </div>
      </DndContext>
    </div>
  );
}
