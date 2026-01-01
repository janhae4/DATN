"use client"

import * as React from "react"
import { useRef, useState, useCallback, useMemo } from "react"
import { FilePreviewDialog } from "./file-preview-dialog"
import {
  LayoutGrid,
  Table2,
  UploadCloud,
  X,
  FileUp,
  Search,
  FileText,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"

// Components & Hooks
import { getColumns } from "./attachment-columns"
import { DataGrid } from "./data-grid"
import { FileCard } from "./file-card"
import { useFiles } from "@/hooks/useFiles"
import { DataTable } from "./data-table"
import { Attachment } from "@/types"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function AttachmentPage() {
    const [paginationState, setPaginationState] = useState({
    pageIndex: 0,
    pageSize: 12,
  });
  
  // Filter states
  const [fileNameFilter, setFileNameFilter] = useState("")
  const [fileTypeFilter, setFileTypeFilter] = useState("all")

  // 1. Quản lý trạng thái dữ liệu qua Hook thực tế
  const {
    files = [],
    isLoading,
    isPlaceholderData,
    uploadFile,
    deleteFile,
    downloadFile,
    previewFile,
    pagination
  } = useFiles(undefined, paginationState.pageIndex + 1, paginationState.pageSize);

  console.log("data in page: ", files)


  // Handle search and filter changes by resetting to first page
  React.useEffect(() => {
    setPaginationState(prev => ({
      ...prev,
      pageIndex: 0, // Reset to first page when filters change
    }));
  }, [fileNameFilter, fileTypeFilter]);

  React.useEffect(() => {
    if (pagination?.currentPage) {
      setPaginationState(prev => ({
        ...prev,
        pageIndex: pagination.currentPage - 1,
      }));
    }
  }, [pagination?.currentPage]);

  const [viewMode, setViewMode] = React.useState<'table' | 'grid'>('grid')
  const [isUploadVisible, setIsUploadVisible] = useState(false)
  const [stagedFiles, setStagedFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // --- LOGIC XỬ LÝ FILE CHỜ (STAGING) ---
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(true);
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const incomingFiles = Array.from(e.dataTransfer.files);
    setStagedFiles(prev => [...prev, ...incomingFiles.filter(f => !prev.some(p => p.name === f.name))]);
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incomingFiles = Array.from(e.target.files || []);
    setStagedFiles(prev => [...prev, ...incomingFiles.filter(f => !prev.some(p => p.name === f.name))]);
  }

  const removeStagedFile = (fileName: string) => {
    setStagedFiles(prev => prev.filter(file => file.name !== fileName));
  }

  // --- LOGIC UPLOAD THỰC TẾ ---
  const handleUpload = async () => {
    if (stagedFiles.length === 0) return;

    setIsUploading(true);
    const promise = async () => {
      for (const file of stagedFiles) {
        await uploadFile(file);
      }
    };

    toast.promise(promise(), {
      loading: 'Uploading...',
      success: () => {
        setStagedFiles([]);
        setIsUploadVisible(false);
        setIsUploading(false);
        return 'Upload successful!';
      },
      error: (err) => {
        setIsUploading(false);
        return `Error: ${err.message || 'Failed to upload'}`;
      }
    });
  }

  // --- LOGIC BỘ LỌC (CLIENT-SIDE) ---
  // Remove client-side filtering since we're doing it server-side
  // The filtering is now handled by the API

  // Lấy danh sách extension duy nhất để làm filter
  const uniqueExtensions = useMemo(() => {
    const exts = new Set<string>();
    files?.forEach(f => {
      const fileName = f?.fileName || ''; // Ensure fileName is a string
      const parts = fileName.split('.');
      if (parts.length > 1) { // Only process if there's an extension
        const ext = parts.pop()?.toLowerCase();
        if (ext) exts.add(ext);
      }
    });
    return Array.from(exts);
  }, [files]);

  // Quản lí preview
  const [previewData, setPreviewData] = React.useState<Attachment | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);

  // Hàm xử lý khi user click Preview
  const handlePreview = async (file: Attachment) => {
    try {
      // 1. Gọi API lấy Presigned URL
      const url = await previewFile(file.id);

      if (url) {
        // 2. Set Data vào state & Mở Dialog
        setPreviewData({ ...file, fileUrl: url });
        setIsPreviewOpen(true);
      }
    } catch (e) {
      toast.error("Failed to open file");
    }
  };

  return (
    <div className="container mx-auto ">


      {/* 1. TIÊU ĐỀ & NÚT TOGGLE */}
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Document Management</h1>
          <p className="text-xs text-zinc-500 font-medium">Upload and organize your project assets</p>
        </div>

        <Button
          variant={isUploadVisible ? "outline" : "default"}
          onClick={() => {
            setIsUploadVisible(!isUploadVisible);
            if (isUploadVisible) setStagedFiles([]);
          }}
          className="rounded-md h-9 px-4 transition-all"
        >
          {isUploadVisible ? (
            <>
              <X className="mr-2 h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-tight">Cancel</span>
            </>
          ) : (
            <>
              <FileUp className="mr-2 h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-tight">Upload File</span>
            </>
          )}
        </Button>
      </div>

      {/* 2. KHUNG UPLOAD (CHỈ HIỆN KHI TOGGLE) */}
      {isUploadVisible && (
        <div className="mb-8 p-1 bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Hidden input */}
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Dropzone Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200
        ${isDragging
                ? 'border-zinc-400 bg-white dark:bg-zinc-900 dark:border-zinc-700'
                : 'border-zinc-200 dark:border-zinc-800 bg-transparent hover:bg-white dark:hover:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700'
              }
      `}
          >
            <div className={`p-4 rounded-full mb-4 transition-colors ${isDragging ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : 'bg-transparent text-zinc-400'}`}>
              <UploadCloud className="h-10 w-10 stroke-[1.5px]" />
            </div>
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
              Click to choose files or drag and drop
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500 font-medium">
              PDF, PNG, JPG, XLSX (Max 10MB per file)
            </p>
          </div>

          {/* Staged Files List (Chỉ hiện khi có file chờ) */}
          {stagedFiles.length > 0 && (
            <div className="mt-4 p-4 bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-lg animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 dark:bg-zinc-100 text-[10px] font-bold text-white dark:text-black">
                    {stagedFiles.length}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">Files selected</span>
                </div>
                <Button size="sm" onClick={handleUpload} className="h-8 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black hover:opacity-90">
                  Confirm Upload
                </Button>
              </div>

              <div className="h-fit max-h-48 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {stagedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-md group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="text-zinc-400 dark:text-zinc-500">
                          <FileText className="h-4 w-4" />
                        </div>
                        <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300 truncate max-w-[150px]" title={file.name}>
                          {file.name}
                        </span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeStagedFile(file.name); }}
                        className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FILTER BAR */}
      <div className="flex flex-col md:flex-row items-end gap-4 mb-6">
        <div className="flex-1 w-full space-y-2">
          <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Enter file name..."
              value={fileNameFilter}
              onChange={(e) => setFileNameFilter(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="w-full md:w-[160px] space-y-2">
          <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Type</label>
          <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
            <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Type</SelectItem>
              {uniqueExtensions.map(ext => (
                <SelectItem key={ext} value={ext} className="uppercase">{ext}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center p-1 bg-muted rounded-md h-10 border">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={`h-8 px-3 rounded-sm ${viewMode === 'grid' ? 'bg-background shadow-sm' : ''}`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Grid View</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className={`h-8 px-3 rounded-sm ${viewMode === 'table' ? 'bg-background shadow-sm' : ''}`}
                >
                  <Table2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Table View</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* DATA DISPLAY AREA */}
   {/* DATA DISPLAY AREA */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Syncing file data...</p>
        </div>
      ) : viewMode === "table" ? (
        <DataTable
          columns={getColumns({
            onPreview: handlePreview,
            onDownload: (file) => downloadFile(file.id),
            onDelete: (file) => deleteFile(file.id),
          })}
          data={files}
          
          // DataTable nhận index 0-based
          pageCount={pagination?.totalPages || 1}
          pageIndex={paginationState.pageIndex} 
          onPageChange={(page) => {
             // Scroll lên đầu
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setPaginationState(prev => ({ ...prev, pageIndex: page }));
          }}
          isLoading={isLoading || isPlaceholderData}
        />
      ) : (
        <DataGrid
          data={files}
          renderItem={(file) => (
            <FileCard
              file={file}
              onPreview={handlePreview}
              onDownload={(f) => downloadFile(f.id)}
              onDelete={(f) => deleteFile(f.id)}
            />
          )}
          // THÊM LOGIC PHÂN TRANG CHO DATAGRID TẠI ĐÂY
          pagination={{
            // Convert 0-based -> 1-based để hiển thị "Page 1"
            currentPage: paginationState.pageIndex + 1, 
            totalPages: pagination?.totalPages || 1,
            // Khi DataGrid trả về trang mới (ví dụ trang 2), ta trừ 1 để lưu vào state (thành 1)
            onPageChange: (newPage) => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setPaginationState(prev => ({ ...prev, pageIndex: newPage - 1 }));
            }
          }}
          isLoading={isLoading || isPlaceholderData}
        />
      )}

      <FilePreviewDialog
        isOpen={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        file={previewData}
      />
    </div>
  )

}