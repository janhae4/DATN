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
  Sparkles,
  CheckCircle2,
  XCircle,
  Brain,
  Upload,
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
import { Attachment, AttachmentType, FileVisibility } from "@/types";

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
import { useSocket } from "@/contexts/SocketContext";
import { streamHelper } from "@/services/apiClient";
import { AISummaryDialog } from "./file-summary-dialog";
import { DataTable } from "@/components/features/documentation/data-table";
import { getColumns } from "@/components/features/documentation/attachment-columns";
import { useTeamMembers } from "@/hooks/useTeam";

interface StagedFile {
  file: File;
  status: "waiting" | "uploading" | "success" | "error" | "processing" | "completed";
  id?: string;
  /** fileId returned by the server after a successful upload — used to match socket events */
  fileId?: string;
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
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all whitespace-nowrap",
          isOver
            ? "bg-primary/10 text-primary"
            : "hover:bg-muted/60",
          isCurrent
            ? "font-bold text-foreground cursor-default bg-muted/30"
            : "text-muted-foreground cursor-pointer hover:text-foreground",
        )}
      >
        {isRoot && <Home className="h-4 w-4" />}
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

  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryTargetFile, setSummaryTargetFile] = useState<Attachment | null>(null);
  const [summaryContent, setSummaryContent] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const { data: members = [] } = useTeamMembers(teamId);

  // Socket for file_status AI-processing events
  const { socket, isConnected } = useSocket();
  // Maps server fileId → local staged entry id
  const fileIdToStagedId = useRef<Map<string, string>>(new Map());
  // Cache for summaries
  const summariesCache = useRef<Map<string, string>>(new Map());


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
    refreshFiles,
  } = useFiles(
    selectedProjectId,
    teamId,
    paginationState.pageIndex + 1,
    paginationState.pageSize,
    currentFolderId,
  );

  React.useEffect(() => {
    if (!socket || !isConnected) return;
    const handleFileStatus = (data: { id: string; name: string; status: string; size?: number }) => {
      const stagedId = fileIdToStagedId.current.get(data.id);

      // If this is an upload completion event (not AI processing yet)
      if (data.status === "UPLOADED" || data.status === "success" || data.status === "UPLOADED_SUCCESS") {
        refreshFiles(); // Refresh DB list to get the real size and state
      }

      if (!stagedId) return;
      setStagedFiles((prev) =>
        prev.map((f) => {
          if (f.id !== stagedId) return f;
          if (data.status === "processing") return { ...f, status: "processing" };
          if (data.status === "completed") return { ...f, status: "completed" };
          if (data.status === "failed") return { ...f, status: "error" };
          if (data.status === "UPLOADED" || data.status === "success" || data.status === "UPLOADED_SUCCESS") return { ...f, status: "success" };
          return f;
        })
      );
    };
    socket.on("file_status", handleFileStatus);
    return () => { socket.off("file_status", handleFileStatus); };
  }, [socket, isConnected, refreshFiles]);

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
        status: item.status === "success" || item.status === "processing" || item.status === "completed" ? item.status : "uploading",
        progress: item.status === "uploading" ? 0 : item.progress,
      }))
    );

    const uploadPromises = stagedFiles.map(async (stagedItem) => {
      if (stagedItem.status === "success" || stagedItem.status === "processing" || stagedItem.status === "completed") return;
      const controller = new AbortController();
      abortControllers.current[stagedItem.id as string] = controller;
      try {
        const fileId = await uploadFile({
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
        });

        // Register fileId mapping for socket tracking
        if (fileId && stagedItem.id) {
          fileIdToStagedId.current.set(fileId, stagedItem.id);
        }

        setStagedFiles((prev) =>
          prev.map((item) =>
            item.id === stagedItem.id
              ? { ...item, status: "success", progress: 100, fileId: fileId || undefined }
              : item,
          ),
        );
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

    // Auto-minimize after upload finished so it doesn't block the view
    setIsMinimized(true);
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

  const handleSummarizeFile = async (file: Attachment, forceRefresh = false) => {
    // Check local memory cache first
    const localCached = summariesCache.current.get(file.id);
    if (!forceRefresh && localCached) {
      setSummaryTargetFile(file);
      setSummaryContent(localCached);
      setIsSummarizing(false);
      setIsSummaryModalOpen(true);
      return;
    }

    // Check pre-existing summary from DB
    if (!forceRefresh && file.aiSummary) {
      setSummaryTargetFile(file);
      setSummaryContent(file.aiSummary);
      setIsSummarizing(false);
      setIsSummaryModalOpen(true);
      return;
    }

    // Prevent duplicate requests if already summarizing THIS file
    if (isSummarizing && summaryTargetFile?.id === file.id && !forceRefresh) {
      setIsSummaryModalOpen(true);
      return;
    }

    setSummaryTargetFile(file);
    setSummaryContent('');
    setIsSummarizing(true);
    setIsSummaryModalOpen(true);

    let fullContent = '';
    try {
      await streamHelper(
        '/ai-discussions/handle-message',
        {
          message: `Hãy tóm tắt nội dung tài liệu này giúp tôi: ${file.fileName}`,
          discussionId: "",
          teamId,
          summarizeId: file.id,
        },
        (chunk: string) => {
          // Robust SSE parsing handles multiple objects in one chunk and filters 'data:' prefix
          const lines = chunk.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data:')) continue;
            
            try {
              const cleaned = trimmed.replace(/^data:\s*/, '');
              const data = JSON.parse(cleaned);
              
              if (data.text) {
                fullContent += data.text;
                setSummaryContent(fullContent);
              }
            } catch (e) {
              // Partial JSON or heartbeat lines - safe to ignore
              console.debug("SSE Parse skip:", trimmed);
            }
          }
        }
      );
      // Save to cache on success
      if (fullContent) {
        summariesCache.current.set(file.id, fullContent);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate AI summary");
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden relative rounded-lg bg-background select-none h-full"
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
        <div className="container mx-auto h-[calc(100vh-40px)] flex flex-col relative z-10 p-4 sm:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
            <div className="space-y-4 max-w-lg">
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground leading-[1.1] flex items-center gap-3">
                File Explorer
                <HelpCircle
                  className="h-6 w-6 text-muted-foreground/40 cursor-pointer hover:text-primary transition-colors"
                  onClick={startTour}
                />
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground font-medium leading-relaxed">
                Manage, share, and organize assets for{" "}
                <span className="text-foreground font-bold">
                  {selectedProjectId
                    ? projects?.find((p) => p.id === selectedProjectId)?.name
                    : "All Projects"}
                </span>
                .
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <Select
                value={selectedProjectId || "unassigned"}
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
                <SelectTrigger className="w-[180px] sm:w-[220px] h-11 rounded-xl bg-card border-border/50 text-sm font-semibold">
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50">
                  <SelectItem value="unassigned" className="font-bold text-sm">Personal Files</SelectItem>
                  {projects?.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="font-bold text-sm">
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
                variant="outline"
                onClick={() => setIsCreateFolderOpen(true)}
                className="gap-2 hidden sm:flex h-11 px-5 rounded-xl border-border/50 bg-card hover:bg-muted font-bold text-sm transition-all hover:scale-101 active:scale-99"
              >
                <FolderPlus className="h-4.5 w-4.5 text-muted-foreground" />
                <span>New Folder</span>
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  if (fileInputRef.current) fileInputRef.current.click();
                }}
                className="gap-2 h-11 px-6 rounded-xl bg-black hover:bg-primary/90 text-white font-bold text-smimary/20 transition-all hover:scale-101 active:scale-99"
              >
                <UploadCloud className="h-4.5 w-4.5 text-white" />
                <span className="hidden  sm:inline text-white">Upload Files</span>
              </Button>
            </div>
          </div>

          <div className="bg-card/60 border border-border/50 rounded-2xl p-2.5 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-2 flex-1 w-full overflow-hidden bg-background/50 rounded-xl px-3 h-12 border border-border/30ner">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 hover:bg-muted text-muted-foreground"
                disabled={breadcrumbs.length === 0}
                onClick={handleNavigateUp}
                title="Go to parent folder"
              >
                <CornerLeftUp className="h-4 w-4 text-muted-foreground" />
              </Button>

              <div className="h-5 w-px bg-border/50 shrink-0 mx-2" />

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mask-gradient-right flex-1 font-medium pb-1 pt-1">
                <DroppableBreadcrumbItem
                  id={null}
                  name="Home"
                  isRoot={true}
                  isCurrent={breadcrumbs.length === 0}
                  onClick={() => handleBreadcrumbClick(-1)}
                />

                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={crumb.id}>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
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
              <div className="flex items-center bg-background/50 rounded-xl p-1 border border-border/30 h-12 mr-2">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className={cn("h-9 w-9 rounded-lg transition-all", viewMode === "grid" && "bg-background shadow-sm")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("table")}
                  className={cn("h-9 w-9 rounded-lg transition-all", viewMode === "table" && "bg-background shadow-sm")}
                >
                  <Table2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="relative flex-1 sm:w-[240px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search files..."
                  value={fileNameFilter}
                  onChange={(e) => setFileNameFilter(e.target.value)}
                  className="pl-10 h-12 rounded-xl bg-background/50 border-border/30 focus-visible:ring-primary/20 text-sm font-medium transition-allner"
                />
              </div>
            </div>
          </div>

          {stagedFiles.length > 0 && (
            <div
              className={cn(
                "fixed bottom-10 right-6 z-50 w-96 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col overflow-hidden transition-all duration-300 ease-in-out shadow-xl",
                isMinimized ? "h-12" : "max-h-[80vh]",
              )}
            >
              {/* Header */}
              <div
                className="bg-zinc-900 text-zinc-50 dark:bg-zinc-800 px-4 h-12 flex items-center justify-between cursor-pointer select-none"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                <div className="flex items-center gap-2">
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                  ) : (
                    <>
                      <UploadCloud className="h-4 w-4 text-zinc-400" />
                      <span className="text-sm font-medium">
                        {stagedFiles.filter(f => f.status === "completed").length > 0
                          ? `${stagedFiles.filter(f => f.status === "completed").length} AI-ready · ${stagedFiles.length} total`
                          : `${stagedFiles.length} file${stagedFiles.length > 1 ? "s" : ""}`}
                      </span>
                    </>
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
                      fileIdToStagedId.current.clear();
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* File list & Footer - Hide when minimized to ensure only header shows */}
              {!isMinimized && (
                <>
                  <div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-950">
                    <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {stagedFiles.map((stagedFile, i) => (
                        <li
                          key={stagedFile.id || i}
                          className="flex items-center gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 group border-b last:border-0 border-zinc-100 dark:border-zinc-800 transition-colors"
                        >
                          {/* File icon */}
                          <div className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                            stagedFile.status === "completed" ? "bg-emerald-50 dark:bg-emerald-900/30" :
                              stagedFile.status === "processing" ? "bg-amber-50 dark:bg-amber-900/30" :
                                stagedFile.status === "error" ? "bg-red-50 dark:bg-red-900/30" :
                                  "bg-zinc-100 dark:bg-zinc-800"
                          )}>
                            {stagedFile.status === "completed" ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            ) : stagedFile.status === "processing" ? (
                              <Brain className="h-5 w-5 text-amber-500 animate-pulse" />
                            ) : stagedFile.status === "error" ? (
                              <XCircle className="h-5 w-5 text-red-500" />
                            ) : (
                              <FileIcon className="h-5 w-5 text-zinc-500" />
                            )}
                          </div>

                          {/* Info */}
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

                            {/* Status row */}
                            {stagedFile.status === "uploading" ? (
                              <Progress
                                value={stagedFile.progress}
                                className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800"
                              />
                            ) : (
                              <div className="flex items-center gap-1.5">
                                {stagedFile.status === "waiting" && (
                                  <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
                                    Ready to upload
                                  </span>
                                )}
                                {stagedFile.status === "success" && (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                    <Check className="h-3 w-3" /> Uploaded
                                  </span>
                                )}
                                {stagedFile.status === "processing" && (
                                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800 animate-pulse">
                                    <Loader2 className="h-3 w-3 animate-spin" /> AI Processing...
                                  </span>
                                )}
                                {stagedFile.status === "completed" && (
                                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                    <CheckCircle2 className="h-3 w-3" /> AI Ready
                                  </span>
                                )}
                                {stagedFile.status === "error" && (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">
                                    <XCircle className="h-3 w-3" /> Failed
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Action button */}
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

                            {(stagedFile.status === "success" || stagedFile.status === "processing") && (
                              <div className="h-8 w-8 flex items-center justify-center">
                                <Loader2 className="h-4 w-4 text-zinc-400 animate-spin" />
                              </div>
                            )}

                            {stagedFile.status === "completed" && (
                              <div className="h-8 w-8 flex items-center justify-center">
                                <Check className="h-5 w-5 text-emerald-500" />
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Footer actions */}
                  <div className="p-3 border-t bg-zinc-50 dark:bg-zinc-900 flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-8 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                      disabled={isUploading}
                      onClick={() => {
                        setStagedFiles([]);
                        fileIdToStagedId.current.clear();
                      }}
                    >
                      Clear all
                    </Button>
                    <Button
                      size="sm"
                      className="text-xs h-8 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 px-4 font-medium"
                      onClick={handleUpload}
                      disabled={isUploading || stagedFiles.every(f => f.status === "success" || f.status === "processing" || f.status === "completed")}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-3 w-3 mr-1.5" />
                          Start Upload
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}

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
                <div className="bg-white dark:bg-zinc-900 p-4 rounded-full mb-4">
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
            <div className="h-100 pb-20">
              {viewMode === "grid" ? (
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
                        onSummarize={handleSummarizeFile}
                      />
                    </DndItemWrapper>
                  );
                })}
                </div>
              ) : (
                <div className="p-4 overflow-hidden">
                  <DataTable
                    data={files}
                    tableColumns={getColumns({
                      onPreview: handleItemClick,
                      onDownload: downloadFile,
                      onDelete: deleteFile,
                      onVisibilityChange: (fileIds, visibility, allowedUserIds) =>
                        changeVisibility({ fileIds, visibility, allowedUserIds }),
                      members,
                      projectId: selectedProjectId,
                      teamId,
                    })}
                    pagination={{
                      currentPage: paginationState.pageIndex + 1,
                      totalPages: pagination?.totalPages || 1,
                      onPageChange: (page) =>
                        setPaginationState((prev) => ({
                          ...prev,
                          pageIndex: page - 1,
                        })),
                    }}
                    isLoading={isLoading}
                    onPreview={handleItemClick}
                    onDownload={downloadFile}
                    onDelete={deleteFile}
                    members={members}
                    projectId={selectedProjectId}
                    teamId={teamId}
                    onVisibilityChange={(fileIds: string[], visibility: FileVisibility, allowedUserIds?: string[]) =>
                      changeVisibility({ fileIds, visibility, allowedUserIds })
                    }
                  />
                </div>
              )}
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
            </div>
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
            onSummarize={handleSummarizeFile}
          />
          <AISummaryDialog
            isOpen={isSummaryModalOpen}
            onOpenChange={setIsSummaryModalOpen}
            file={summaryTargetFile}
            summaryContent={summaryContent}
            isLoading={isSummarizing}
            onRegenerate={() => summaryTargetFile && handleSummarizeFile(summaryTargetFile, true)}
          />
        </div>
      </DndContext>
    </div>
  );
}
