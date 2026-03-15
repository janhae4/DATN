import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import { fileService, GetFilesResponse } from "@/services/fileService";
import { Attachment, AttachmentType, FileVisibility, UploadAttachment, ApprovalStatus } from "@/types";
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
          fileSize: file.size || 0,
          fileType: file.type,
          uploadedById: file.userId || "System",
          uploadedAt: file.createdAt,
          name: file.originalName,
          taskId: "general",
          fileUrl: "",
          status: file.status,
          mimeType: file.mimetype,
          visibility: file.visibility,
          allowedUserIds: file.allowedUserIds,
          aiSummary: file.aiSummary,
          approvalStatus: file.approvalStatus || ApprovalStatus.APPROVED
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
      const msg = error.response?.data?.message || error.message || "Failed to upload file";
      toast.error(msg);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (fileId: string) => fileService.deleteFile(fileId, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast.success("Deleted file successfully");
    },
    onError: () => {
      toast.error("Failed to delete file");
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
      const msg = error?.response?.data?.message || "Failed to create folder";
      toast.error(msg);
    }
  });

  const moveFileToFolder = useMutation({
    mutationFn: async ({ fileId, parentId }: { fileId: string, parentId: string }) => {
      return fileService.moveFileToFolder(fileId, parentId, projectId, teamId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast.success("Moved file to folder");
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || "Failed to move file";
      toast.error(msg);
    }
  })

  const moveFilesToFolder = useMutation({
    mutationFn: async ({ fileIds, parentId }: { fileIds: string[], parentId: string }) => {
      return fileService.moveFilesToFolder(fileIds, parentId, projectId, teamId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast.success("Moved files to folder");
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || "Failed to move files";
      toast.error(msg);
    }
  })

  const changeVisibility = useMutation({
    mutationFn: async ({ fileIds, visibility, allowedUserIds }: { fileIds: string[], visibility: FileVisibility, allowedUserIds?: string[] }) => {
      return fileService.changeVisibility(fileIds, visibility, allowedUserIds, projectId, teamId);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast.success("Visibility changed successfully");
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || "Failed to change visibility";
      toast.error(msg);
    }
  })

  const previewFile = async (fileId: string): Promise<string | null> => {
    try {
      const { viewUrl } = await fileService.getPreviewUrl(fileId, projectId);
      return viewUrl || null;
    } catch (err) {
      toast.error("Failed to preview file");
      return null;
    }
  };

  const deleteFiles = useMutation({
    mutationFn: (fileIds: string[]) => fileService.deleteFiles(fileIds, projectId, teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast.success("Deleted files successfully");
    },
    onError: () => {
      toast.error("Failed to delete files");
    }
  })

  const downloadFiles = useMutation({
    mutationFn: (fileIds: string[]) => fileService.downloadFiles(fileIds, projectId, teamId),
    onError: () => {
      toast.error("Failed to download files");
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