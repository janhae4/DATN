import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fileService, GetFilesResponse } from "@/services/fileService";
import { Attachment } from "@/types";

const getMimeTypeByExtension = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const mimeMap: Record<string, string> = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
    'gif': 'image/gif', 'webp': 'image/webp',
    'txt': 'text/plain', 'zip': 'application/zip',
  };
  return extension ? (mimeMap[extension] || `application/${extension}`) : 'application/octet-stream';
};

export function useFiles(teamId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ["files", teamId || "personal"];

  const { data: files = [], isLoading } = useQuery<GetFilesResponse, Error, Attachment[]>({
    queryKey,
    queryFn: () => fileService.getFiles(teamId),
    staleTime: 1000 * 60 * 5,
    select: (response): Attachment[] => {
      return response.data.map((file) => ({
        id: file._id,
        fileName: file.originalName,
        fileSize: file.size || 0,
        fileType: file?.mimeType || getMimeTypeByExtension(file.originalName),
        uploadedById: file.userId || "System",
        uploadedAt: file.createdAt,
        taskId: "general",
        fileUrl: "",
        status: file.status
      }));
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const { uploadUrl, fileId } = await fileService.initiateUpload({
        fileName: file.name
      }, teamId);
      await fileService.uploadFileToMinIO(uploadUrl, file);
      return fileId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || error.message || "Không thể tải lên tập tin";
      toast.error(`Lỗi: ${msg}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (fileId: string) => fileService.deleteFile(fileId, teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Đã xóa tập tin");
    },
    onError: () => {
      toast.error("Không thể xóa tập tin này");
    }
  });

  const downloadFile = async (fileId: string) => {
    try {
      const { downloadUrl } = await fileService.getDownloadUrl(fileId, teamId);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', '');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      toast.error("Không thể lấy đường dẫn tải xuống");
    }
  };

const previewFile = async (fileId: string): Promise<string | null> => {
  try {
    const { viewUrl } = await fileService.getPreviewUrl(fileId, teamId);
    return viewUrl || null;
  } catch (err) {
    toast.error("Không thể xem trước tập tin");
    return null;
  }
}

  return {
    files,
    isLoading,
    uploadFile: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    deleteFile: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    downloadFile,
    previewFile,
    refreshFiles: () => queryClient.invalidateQueries({ queryKey })
  };
}