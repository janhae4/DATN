"use client"

import * as React from "react"
// THÊM IMPORTS MỚI
import { useRef, useState, useCallback, useMemo } from "react" // <-- Thêm useMemo
import { 
  UploadCloud, 
  File as FileIcon, 
  X, 
  CheckCircle, 
  FileUp, 
  Search,
  FileText,
  FileImage,
  FileSpreadsheet,
  FileCode,
  FileArchive,
  FileAudio,
  FileVideo,
  Presentation
} from "lucide-react" // <-- Thêm Search
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input" // <-- Thêm Input
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select" // <-- Thêm Select
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
// END IMPORTS MỚI

import { columns } from "./attachment-columns"
import { DataTable } from "./data-table"
import { Attachment } from "@/types"

// Data mẫu (Giữ nguyên)
async function getAttachmentData(): Promise<Attachment[]> {
  return [
    {
      id: "att_001",
      taskId: "task_123",
      fileName: "KhoaLuan_Final_v3.pdf",
      fileUrl: "/uploads/KhoaLuan_Final_v3.pdf",
      uploadedById: "user_nguyen_21",
      uploadedAt: "2025-10-28T14:30:00Z",
      fileType: "application/pdf",
      fileSize: 10485760,
    },
    {
      id: "att_002",
      taskId: "task_123",
      fileName: "database_diagram.png",
      fileUrl: "/uploads/database_diagram.png",
      uploadedById: "user_son_bo_nguyen",
      uploadedAt: "2025-10-29T09:15:00Z",
      fileType: "image/png",
      fileSize: 819200,
    },
    {
      id: "att_003",
      taskId: "task_456",
      fileName: "requirements_doc.txt",
      fileUrl: "/uploads/requirements_doc.txt",
      uploadedById: "user_nguyen_21",
      uploadedAt: "2025-10-27T11:00:00Z",
      fileType: "text/plain",
      fileSize: 1200,
    },
    {
      id: "att_004",
      taskId: "task_789",
      fileName: "Sprint_Plan.xlsx",
      fileUrl: "/uploads/Sprint_Plan.xlsx",
      uploadedById: "user_456_tester",
      uploadedAt: "2025-10-26T10:00:00Z",
      fileType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      fileSize: 51200,
    },
  ]
}

// Hàm helper format byte (Giữ nguyên)
const formatBytes = (bytes: number | undefined, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  if (i === 0) return `${bytes} Bytes`;
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}


// Helper function to get icon based on file type
const getFileIcon = (file: File) => {
  const type = file.type;
  const name = file.name.toLowerCase();

  if (type.includes('image')) return <FileImage className="h-5 w-5 text-blue-500" />;
  if (type.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
  if (type.includes('spreadsheet') || name.match(/\.(xlsx?|csv)$/)) return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
  if (type.includes('word') || name.match(/\.docx?$/)) return <FileText className="h-5 w-5 text-blue-600" />;
  if (type.includes('presentation') || name.match(/\.pptx?$/)) return <Presentation className="h-5 w-5 text-orange-500" />;
  if (type.includes('zip') || type.includes('compressed') || name.match(/\.(zip|rar|7z|tar|gz)$/)) return <FileArchive className="h-5 w-5 text-yellow-600" />;
  if (type.includes('audio')) return <FileAudio className="h-5 w-5 text-purple-500" />;
  if (type.includes('video')) return <FileVideo className="h-5 w-5 text-pink-500" />;
  if (type.includes('text') || name.match(/\.(txt|md|json|js|ts|html|css)$/)) return <FileCode className="h-5 w-5 text-gray-600" />;
  
  return <FileIcon className="h-5 w-5 text-gray-400" />;
};

export default function AttachmentPage() {
  const [allData, setAllData] = React.useState<Attachment[]>([]) // Master list

  // --- LOGIC UPLOAD MỚI (Giữ nguyên) ---
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Xử lý khi kéo file vào/ra
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  // Xử lý khi thả file
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files && files.length > 0) {
      // Dùng Set để tránh file trùng tên
      setStagedFiles((prevFiles) => {
        const newFiles = [...prevFiles];
        files.forEach(file => {
          if (!prevFiles.some(f => f.name === file.name)) {
            newFiles.push(file);
          }
        });
        return newFiles;
      });
    }
  }, []);

  // Xử lý khi bấm nút "Choose File"
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files && files.length > 0) {
      setStagedFiles((prevFiles) => {
        const newFiles = [...prevFiles];
        files.forEach(file => {
          if (!prevFiles.some(f => f.name === file.name)) {
            newFiles.push(file);
          }
        });
        return newFiles;
      });
    }
  };

  // Xóa 1 file khỏi danh sách chờ
  const removeStagedFile = (fileName: string) => {
    setStagedFiles((prevFiles) => prevFiles.filter(f => f.name !== fileName));
  };

  // --- XỬ LÝ UPLOAD (ĐÃ SỬA) ---
  const handleUpload = () => {
    console.log("Uploading files:", stagedFiles);
    
    // --- LOGIC MỚI: Biến File[] thành Attachment[] ---
    const newUploadedAttachments: Attachment[] = stagedFiles.map(file => {
      const newAttachment: Attachment = {
        id: `att_${crypto.randomUUID().substring(0, 8)}`, // Tạo ID ngẫu nhiên
        taskId: "task_new_upload", // Gán task ID tạm
        fileName: file.name,
        fileUrl: URL.createObjectURL(file), // <-- MẤU CHỐT! Tạo link local
        uploadedById: "user_nguyen_21", // Giả lập là "mày" upload
        uploadedAt: new Date().toISOString(), // Giờ upload
        fileType: file.type,
        fileSize: file.size,
      };
      return newAttachment;
    });

    // Thêm file mới vào đầu danh sách (cho nó hiện lên trên)
    setAllData(prevData => [...newUploadedAttachments, ...prevData]);
    
    // Xóa file khỏi danh sách chờ
    setStagedFiles([]);
    
    // KHÔNG GỌI getAttachmentData() nữa, vì nó sẽ ghi đè mất file local
    // getAttachmentData().then(setAllData); 
    
    // Thêm toast "Upload success" ở đây là đẹp
  };
  // --- KẾT THÚC UPLOAD (ĐÃ SỬA) ---


  // State cho filter
  const [fileNameFilter, setFileNameFilter] = React.useState("");
  const [fileTypeFilter, setFileTypeFilter] = React.useState("all");
  const [userFilter, setUserFilter] = React.useState("all");

  // Lấy danh sách các loại file duy nhất từ dữ liệu
  const uniqueFileTypes = React.useMemo(() => {
    const types = new Set<string>();
    allData.forEach(file => {
      if (file.fileType) {
        // Thêm loại file chính (image, application, text, ...)
        const mainType = file.fileType.split('/')[0];
        types.add(mainType);
        
        // Thêm các loại file đặc biệt
        if (file.fileType.includes('pdf')) types.add('pdf');
        if (file.fileType.includes('spreadsheet') || file.fileName.match(/\.(xlsx?|csv)$/i)) types.add('spreadsheet');
        if (file.fileType.includes('word') || file.fileName.match(/\.docx?$/i)) types.add('document');
        if (file.fileType.includes('presentation') || file.fileName.match(/\.pptx?$/i)) types.add('presentation');
        if (file.fileType.includes('image')) types.add('image');
        if (file.fileType === 'text/plain') types.add('text');
      }
    });
    return Array.from(types).sort();
  }, [allData]);

  React.useEffect(() => {
    getAttachmentData().then(data => {
      setAllData(data); // Set master list (data mock ban đầu)
    });
  }, []) // Chỉ chạy 1 lần lúc load trang

  const filteredData = useMemo(() => {
    return allData.filter(item => {
      // 1. Filter theo Tên File
      if (fileNameFilter && !item.fileName.toLowerCase().includes(fileNameFilter.toLowerCase())) {
        return false;
      }

      // 2. Filter theo Loại File
      if (fileTypeFilter !== "all") {
        let matches = false;
        if (fileTypeFilter === 'pdf') matches = item.fileType === 'application/pdf';
        else if (fileTypeFilter === 'image') matches = !!item.fileType?.startsWith('image/');
        else if (fileTypeFilter === 'text') matches = item.fileType === 'text/plain';
        else if (fileTypeFilter === 'spreadsheet') matches = !!item.fileType?.includes('spreadsheetml');

        if (!matches) return false;
      }

      // 3. Filter theo Người Upload
      if (userFilter !== "all") {
        if (item.uploadedById !== userFilter) return false;
      }

      return true; // Passed all filters
    });
  }, [allData, fileNameFilter, fileTypeFilter, userFilter]);
  // --- KẾT THÚC LOGIC FILTER ---


  return (
    <div className="container mx-auto ">
      {/* TIÊU ĐỀ (Giữ nguyên) */}
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-2xl font-bold">File Management</h1>
        <Button onClick={() => fileInputRef.current?.click()}>
          <FileUp className="mr-2 h-4 w-4" />
          Upload File
        </Button>
      </div>

      {/* --- KHUNG UPLOAD MỚI (Giữ nguyên) --- */}
      <div className="mb-8">
        {/* Hidden input */}
        <input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Dropzone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg cursor-pointer transition-colors
            ${isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400 bg-gray-50'
            }
          `}
        >
          <UploadCloud className={`h-12 w-12 ${isDragging ? 'text-blue-600' : 'text-gray-400'}`} />
          <p className="mt-4 text-lg font-semibold text-gray-700">
            Click to choose files or drag and drop
          </p>
          <p className="text-sm text-gray-500">
            Supports multiple files (PDF, PNG, DOCX, etc.)
          </p>
        </div>

        {stagedFiles.length > 0 && (
          <Card className="mt-6 animate-in fade-in-50 slide-in-from-bottom-5 duration-300">
            <CardHeader className="flex flex-row items-center justify-between ">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <FileUp className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-semibold">
                            Files to upload
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {stagedFiles.length} {stagedFiles.length > 1 ? 'files' : 'file'} selected
                        </p>
                    </div>
                </div>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setStagedFiles([])} 
                    className="text-muted-foreground cursor-pointer h-8 px-2 lg:px-3"
                >
                    Clear all
                </Button>
            </CardHeader>
            
            <CardContent className="p-0">
                <ScrollArea className="h-fit max-h-60 overflow-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {stagedFiles.map((file, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-muted/40 border rounded-xl group hover:bg-muted/60 hover:border-primary/20 transition-all duration-200">
                            <div className="h-10 w-10 rounded-lg bg-background border shadow-sm flex items-center justify-center shrink-0 text-primary">
                                {getFileIcon(file)}
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <span className="text-sm font-medium truncate w-full" title={file.name}>
                                        {file.name}
                                    </span>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-5 w-5 -mt-1 -mr-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive" 
                                        onClick={() => removeStagedFile(file.name)}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                                <span className="text-xs text-muted-foreground mt-1">{formatBytes(file.size)}</span>
                            </div>
                        </div>
                    ))}
                    </div>
                </ScrollArea>
            </CardContent>
            
            <div className=" bg-muted/20  flex justify-end  px-4">
                <Button size="lg" className="w-full rounded md:w-auto min-w-[200px] shadow-md" onClick={handleUpload}>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Upload {stagedFiles.length} {stagedFiles.length > 1 ? 'files' : 'file'}
                </Button>
            </div>
          </Card>
        )}
      </div>
      {/* --- KẾT THÚC KHUNG UPLOAD --- */}


      {/* --- THANH FILTER MỚI --- */}
      <div className="flex flex-col md:flex-row items-center gap-4  ">
        {/* Filter 1: Tên File */}
        <div className="w-full md:flex-1">
          <label htmlFor="fileNameFilter" className="text-sm font-medium text-gray-700">Filter by name</label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="fileNameFilter"
              placeholder="Search by file name..."
              value={fileNameFilter}
              onChange={(e) => setFileNameFilter(e.target.value)}
              className="pl-9 max-w-full"
            />
          </div>
        </div>

        {/* Filter 2: Loại File */}
        <div className="w-full md:w-auto">
          <label htmlFor="fileTypeFilter" className="text-sm font-medium text-gray-700">File Type</label>
          <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
            <SelectTrigger id="fileTypeFilter" className="w-full md:w-[180px] mt-1">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {uniqueFileTypes.map((type: string) => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filter 3: Người Upload (Dùng data mẫu) */}
        <div className="w-full md:w-auto">
          <label htmlFor="userFilter" className="text-sm font-medium text-gray-700">Uploaded By</label>
          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger id="userFilter" className="w-full md:w-[200px] mt-1">
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="user_nguyen_21">Nguyen (You)</SelectItem>
              <SelectItem value="user_son_bo_nguyen">Son (Friend)</SelectItem>
              <SelectItem value="user_456_tester">Tester</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* --- KẾT THÚC THANH FILTER --- */}


      {/* BẢNG DATA (Đã bỏ props filter) */}
      <DataTable
        columns={columns}
        data={filteredData} // <-- DÙNG DATA ĐÃ FILTER
      // Bỏ 2 props này đi, vì mình đã tự handle ở trên
      // searchColumn="fileName" 
      // searchPlaceholder="Filter files by name..."
      />
    </div>
  )
}

