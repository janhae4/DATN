import * as React from "react"
import { UploadCloud, Loader2 } from "lucide-react"

interface UploadTabProps {
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isUploading: boolean;
    fileInputRef: React.RefObject<HTMLInputElement>;
}

export function UploadTab({ onFileSelect, isUploading, fileInputRef }: UploadTabProps) {
    return (
        <div
            className="flex flex-col items-center justify-center h-[200px] border-2 border-dashed rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
        >
            <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                onChange={onFileSelect}
            />
            {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Uploading...</span>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-2">
                    <UploadCloud className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm font-medium">Click to upload</span>
                    <span className="text-xs text-muted-foreground">Support all file types</span>
                </div>
            )}
        </div>
    )
}
