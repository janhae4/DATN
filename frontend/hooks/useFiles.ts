import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import { fileService, GetFilesResponse } from "@/services/fileService";
import { Attachment, AttachmentType, FileVisibility, UploadAttachment } from "@/types";
import mime from "mime-types";

const getMimeTypeByExtension = (fileName: string): string => {
  return mime.lookup(fileName) || 'application/octet-stream';
};

export function useFiles(
  projectId?: string,
  teamId?: string,
  page: number = 1,
  limit: number = 10,
  parentId: string | null = null
) {
  const queryClient = useQueryClient();
  const queryKey = ["files", projectId || undefined, teamId, parentId || null, page, limit];
  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey,
    queryFn: () => {
      if (!parentId) {
        return fileService.getFiles(projectId, teamId, page, limit);
      }
      return fileService.getFolder(parentId);
    },
    staleTime: 0,
    select: (response: GetFilesResponse) => {
      const mappedFiles: Attachment[] = response.data.map((file) => {
        return {
          id: file._id,
          fileName: file.originalName,
          fileSize: file.size,
          fileType: file.type,
          uploadedById: file.userId || "System",
          uploadedAt: file.createdAt,
          name: file.originalName,
          taskId: "general",
          fileUrl: "",
          status: file.status,
          mimeType: file.mimetype,
          visibility: file.visibility,
          allowedUserIds: file.allowedUserIds
        };
      });

      return {
        files: mappedFiles,
        pagination: response.pagination
      };
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, onProgress, signal }: UploadAttachment) => {
      const { uploadUrl, fileId } = await fileService.initiateUpload({
        fileName: file.name,
        fileType: getMimeTypeByExtension(file.name),
        parentId: parentId || null,
      }, projectId, teamId);

      await fileService.uploadFileToMinIO(uploadUrl, file, onProgress, signal);
      return fileId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || error.message || "Không thể tải lên tập tin";
      toast.error(msg);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (fileId: string) => fileService.deleteFile(fileId, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast.success("Đã xóa tập tin");
    },
    onError: () => {
      toast.error("Không thể xóa tập tin này");
    }
  });

  const downloadFile = async (fileId: string) => {
    const url = `http://${process.env.NEXT_PUBLIC_API_URL}/files/${fileId}/download`;
    window.open(url, '_blank');
  };

  const createFolderMutation = useMutation({
    mutationFn: async (folderName: string) => {
      return fileService.createFolder(folderName, parentId || null, projectId, teamId);
    },

    onSuccess: (newFolderData: any) => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || "Không thể tạo thư mục";
      toast.error(msg);
    }
  });

  const moveFileToFolder = useMutation({
    mutationFn: async ({ fileId, parentId }: { fileId: string, parentId: string }) => {
      return fileService.moveFileToFolder(fileId, parentId, projectId, teamId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast.success("Thêm tập tin vào thư mục");
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || "Không thể tạo thư mục";
      toast.error(msg);
    }
  })

  const moveFilesToFolder = useMutation({
    mutationFn: async ({ fileIds, parentId }: { fileIds: string[], parentId: string }) => {
      return fileService.moveFilesToFolder(fileIds, parentId, projectId, teamId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast.success("Thêm tập tin vào thư mục");
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || "Không thể tạo thư mục";
      toast.error(msg);
    }
  })

  const changeVisibility = useMutation({
    mutationFn: async ({ fileIds, visibility, allowedUserIds }: { fileIds: string[], visibility: FileVisibility, allowedUserIds?: string[] }) => {
      return fileService.changeVisibility(fileIds, visibility, allowedUserIds, projectId, teamId);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast.success("Đã thay đổi quyen truy cập");
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || "Không thể thay đổi quyen truy cập";
      toast.error(msg);
    }
  })

  const previewFile = async (fileId: string): Promise<string | null> => {
    try {
      const { viewUrl } = await fileService.getPreviewUrl(fileId, projectId);
      return viewUrl || null;
    } catch (err) {
      toast.error("Không thể xem trước tập tin");
      return null;
    }
  };

  const deleteFiles = useMutation({
    mutationFn: (fileIds: string[]) => fileService.deleteFiles(fileIds, projectId, teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast.success("Đã xóa tập tin");
    },
    onError: () => {
      toast.error("Không thể xóa tập tin");
    }
  })

  const downloadFiles = useMutation({
    mutationFn: (fileIds: string[]) => fileService.downloadFiles(fileIds, projectId, teamId),
    onError: () => {
      toast.error("Không thể tải lên tập tin");
    }
  })

  return {
    files: data?.files || [],
    pagination: data?.pagination || null,
    isPlaceholderData,

    uploadFile: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,

    deleteFile: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    isLoading,
    downloadFile,
    downloadFiles: downloadFiles.mutateAsync,
    previewFile,
    createFolder: createFolderMutation.mutateAsync,
    moveFileToFolder: moveFileToFolder.mutateAsync,
    moveFilesToFolder: moveFilesToFolder.mutateAsync,
    changeVisibility: changeVisibility.mutateAsync,
    deleteFiles: deleteFiles.mutateAsync,
    refreshFiles: () => queryClient.invalidateQueries({ queryKey })
  };
}