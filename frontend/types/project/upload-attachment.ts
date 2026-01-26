export interface UploadAttachment {
    file: File;
    onProgress?: (p: number) => void;
    signal?: AbortSignal;
}