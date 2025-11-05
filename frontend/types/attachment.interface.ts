export interface Attachment {
  id: string;
  taskId: string;       
  fileName: string;     
  fileUrl: string;     
  uploadedById: string; // ID của User đã upload file
  uploadedAt: string; 
  fileType?: string;    // "image/png", "application/pdf"
  fileSize?: number;    // byte 
}