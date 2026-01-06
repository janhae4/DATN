// types/attachment.interface.ts

export interface Attachment {
  id: string;
  taskId: string;
  fileName: string;
  fileUrl: string;
  uploadedById: string;
  uploadedAt: string;
  fileType: string;
  fileSize: number;
}