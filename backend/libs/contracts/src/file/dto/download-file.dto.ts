export class ZipFileEntry {
    storageKey: string;
    zipPath: string;
}

export class RedirectResponseDto {
    action: 'REDIRECT';
    url: string;
}

export class StreamFolderResponseDto {
    action: 'STREAM_FOLDER';
    folderName: string;
    files: ZipFileEntry[];
}

export type FileDownloadResult = RedirectResponseDto | StreamFolderResponseDto;