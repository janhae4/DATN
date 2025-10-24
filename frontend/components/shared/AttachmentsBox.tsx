// components/task/AttachmentsBox.tsx
import * as React from "react"
import { FileText, Upload, Download, Trash2, Image as ImageIcon } from "lucide-react"
import { Separator } from "@/components/ui/separator"

// Định nghĩa type cho attachment
interface Attachment {
    id: string
    name: string
    size: string
    type: string
    url?: string
    file?: File
}

// State quản lý attachments
const useAttachments = () => {
    const [attachments, setAttachments] = React.useState<Attachment[]>([])

    const addAttachment = (file: File) => {
        const newAttachment: Attachment = {
            id: Date.now().toString(),
            name: file.name,
            size: formatFileSize(file.size),
            type: file.type,
            file: file
        }
        setAttachments(prev => [...prev, newAttachment])
    }

    const removeAttachment = (id: string) => {
        setAttachments(prev => prev.filter(att => att.id !== id))
    }

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    return {
        attachments,
        addAttachment,
        removeAttachment
    }
}

export function AttachmentsBox() {
    const { attachments, addAttachment, removeAttachment } = useAttachments()
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    // Drag & Drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()

        const files = Array.from(e.dataTransfer.files)
        files.forEach(file => {
            if (file.size <= 10 * 1024 * 1024) { // Max 10MB
                addAttachment(file)
            } else {
                alert(`File ${file.name} is too large. Maximum size is 10MB.`)
            }
        })
    }

    // Click upload handler
    const handleUploadClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        files.forEach(file => {
            if (file.size <= 10 * 1024 * 1024) { // Max 10MB
                addAttachment(file)
            } else {
                alert(`File ${file.name} is too large. Maximum size is 10MB.`)
            }
        })
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    // Download handler
    const handleDownload = (attachment: Attachment) => {
        if (attachment.url) {
            // Nếu có URL, download từ server
            window.open(attachment.url, '_blank')
        } else if (attachment.file) {
            // Nếu là file local, tạo download link
            const url = URL.createObjectURL(attachment.file)
            const a = document.createElement('a')
            a.href = url
            a.download = attachment.name
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        }
    }

    // Get file icon based on type
    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) {
            return <ImageIcon className="h-4 w-4 text-blue-500" />
        }
        return <FileText className="h-4 w-4 text-muted-foreground" />
    }

    return (
        <div className="flex flex-col gap-4 mt-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
                <FileText className="h-5 w-5" />
                Attachments ({attachments.length})
            </h3>

            {/* Vùng kéo & thả (Drag and Drop Area) */}
            <div
                className="flex flex-col items-center justify-center min-h-[100px] border-2 border-dashed border-input rounded-xl p-4 text-center bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer"
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDrop={handleDrop}
                onClick={handleUploadClick}
            >
                <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                    Drop your files here or {" "}
                    <button className="text-primary hover:underline font-medium">
                        upload
                    </button>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    Maximum file size: 10MB
                </p>
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.svg"
            />

            {/* Danh sách file đã đính kèm */}
            {attachments.length > 0 && (
                <div className="flex flex-col gap-2">
                    {attachments.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-2 bg-background border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                {getFileIcon(file.type)}
                                <span className="text-sm font-medium truncate flex-1">{file.name}</span>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">{file.size}</span>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                                <button
                                    onClick={() => handleDownload(file)}
                                    className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                                    title="Download file"
                                >
                                    <Download className="h-3 w-3" />
                                </button>
                                <button
                                    onClick={() => removeAttachment(file.id)}
                                    className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-destructive transition-colors"
                                    title="Delete file"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}