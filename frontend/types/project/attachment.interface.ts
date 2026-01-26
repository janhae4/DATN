// types/attachment.interface.ts
export enum AttachmentType {
  FILE = 'FILE',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  FOLDER = 'FOLDER',
}

export enum FileVisibility {
  PRIVATE = 'PRIVATE',
  TEAM = 'TEAM',
  SPECIFIC = 'SPECIFIC'
}

export interface Attachment {
  name: string;
  id: string;
  taskId: string;
  fileName: string;
  fileUrl: string;
  fileType: AttachmentType;
  uploadedById: string;
  uploadedAt: string;
  fileSize: number;
  mimeType: string;
  visibility: FileVisibility
  allowedUserIds?: string[]
}