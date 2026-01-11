import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import { fileService, GetFilesResponse } from "@/services/fileService";
import { Attachment } from "@/types"; // Đảm bảo type này khớp với UI của mày

// Helper function giữ nguyên
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

export function useFiles(projectId?: string, page: number = 1, limit: number = 10) {
  const queryClient = useQueryClient();

  const queryKey = ["files", projectId || "personal", page, limit];

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey,
    queryFn: () => fileService.getFiles(projectId, page, limit),
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,

    select: (response: GetFilesResponse) => {
      const mappedFiles: Attachment[] = response.data.map((file) => {
        return {
          id: file._id,
          fileName: file.originalName,
          fileSize: file.size,
          fileType: file.mimetype || getMimeTypeByExtension(file.originalName),
          uploadedById: file.userId || "System",
          uploadedAt: file.createdAt,
          taskId: "general",
          fileUrl: "",
          status: file.status
        };
      });

      return {
        files: mappedFiles,
        pagination: response.pagination
      };
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const { uploadUrl, fileId } = await fileService.initiateUpload({
        fileName: file.name,
        fileType: file.type
      }, projectId);

      await fileService.uploadFileToMinIO(uploadUrl, file);
      return fileId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", projectId || "personal"] });
      toast.success("Tải lên thành công!");
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || error.message || "Không thể tải lên tập tin";
      toast.error(`Lỗi: ${msg}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (fileId: string) => fileService.deleteFile(fileId, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", projectId || "personal"] });
      toast.success("Đã xóa tập tin");
    },
    onError: () => {
      toast.error("Không thể xóa tập tin này");
    }
  });

  const downloadFile = async (fileId: string) => {
    try {
      const { downloadUrl } = await fileService.getDownloadUrl(fileId, projectId);
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
      const { viewUrl } = await fileService.getPreviewUrl(fileId, projectId);
      return viewUrl || null;
    } catch (err) {
      toast.error("Không thể xem trước tập tin");
      return null;
    }
  };

  return {
    files: data?.files || [],
    pagination: data?.pagination || null,
    isLoading,
    isPlaceholderData,

    uploadFile: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,

    deleteFile: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,

    downloadFile,
    previewFile,
    refreshFiles: () => queryClient.invalidateQueries({ queryKey })
  };
}