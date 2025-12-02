"use client"

import * as React from "react"
import { useModal } from "@/hooks/useModal"
import { ColumnDef, Row } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Download, Trash, FileText, X } from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip"
import {
    Avatar,
    AvatarFallback,
    AvatarImage
} from "@/components/ui/avatar"
import { FileTypeBadge } from "./file-type-badge"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog"

import FilePreview from "./filePreview"
import { Attachment } from "@/types"
import { db } from "@/public/mock-data/mock-data"

// --- 1. Helper Function ---
const formatBytes = (bytes: number | undefined, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    if (i === 0) return `${bytes} Bytes`;

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// --- 2. TÁCH COMPONENT: FileNameCell (Fix lỗi useState) ---
const FileNameCell = ({ row }: { row: Row<Attachment> }) => {
    const { fileName } = row.original;
    // Hooks được gọi hợp lệ ở đây vì tên hàm viết hoa (Component)
    const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);

    return (
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogTrigger asChild>
                <button
                    className="flex items-center gap-2 group text-left"
                >
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-blue-600 group-hover:underline">
                        {fileName}
                    </span>
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl w-full sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl h-auto max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="truncate">{fileName}</DialogTitle>
                    <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </DialogClose>
                </DialogHeader>
                <div className="overflow-auto p-6 pt-0">
                    <FilePreview file={row.original} />
                </div>
            </DialogContent>
        </Dialog>
    );
};

// --- 3. TÁCH COMPONENT: ActionCell (Fix lỗi useModal) ---
const ActionCell = ({ row }: { row: Row<Attachment> }) => {
    const attachment = row.original;
    // Hooks được gọi hợp lệ ở đây
    const { isOpen, open, close } = useModal(false);

    return (
        <AlertDialog open={isOpen} onOpenChange={(isOpen) => isOpen ? open() : close()}>
            <TooltipProvider delayDuration={100}>
                <div className="flex items-center gap-2">
                    {/* DOWNLOAD BUTTON */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = attachment.fileUrl;
                                    link.download = attachment.fileName;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}
                            >
                                <Download className="h-4 w-4" />
                                <span className="sr-only">Download</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Download file</p>
                        </TooltipContent>
                    </Tooltip>

                    {/* DELETE BUTTON */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <AlertDialogTrigger asChild onClick={open}>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                >
                                    <Trash className="h-4 w-4" />
                                    <span className="sr-only">Delete</span>
                                </Button>
                            </AlertDialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Delete file</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </TooltipProvider>

            {/* MODAL CONTENT */}
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. Are you sure you want to delete the file
                        <strong className="mx-1">{attachment.fileName}</strong>?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => {
                            console.log("Confirmed delete:", attachment.id);
                            // Call delete API here
                            close();
                        }}
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

// --- 4. Column Definitions ---
export const columns: ColumnDef<Attachment>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
                className="translate-y-[2px]"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
                className="translate-y-[2px]"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "fileName",
        header: "File Name",
        enableHiding: false,
        // GỌI COMPONENT ĐÃ TÁCH Ở TRÊN
        cell: ({ row }) => <FileNameCell row={row} />,
    },
    {
        accessorKey: "fileType",
        header: "File Type",
        enableSorting: true,
        cell: ({ row }) => {
            const fileType = row.original.fileType;
            return <FileTypeBadge fileType={fileType} fileName={row.original.fileName} />
        },
    },
    {
        accessorKey: "fileSize",
        header: "Size",
        enableSorting: true,
        cell: ({ row }) => {
            return formatBytes(row.original.fileSize);
        },
    },
    {
        accessorKey: "uploadedById",
        header: "Uploaded By",
        cell: ({ row }) => {
            const userId = row.original.uploadedById;
            const user = db.users.find(u => u.id === userId);
            if (!user) {
                return <span className="text-gray-500">{userId}</span>
            }

            const fallback = user.name
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase() || "US";

            return (
                <TooltipProvider delayDuration={100}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.avatar} />
                                    <AvatarFallback>{fallback}</AvatarFallback>
                                </Avatar>
                                <span>{user.name}</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{user.email}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )
        },
    },
    {
        accessorKey: "uploadedAt",
        header: "Upload Date",
        enableSorting: true,
        cell: ({ row }) => {
            try {
                const date = new Date(row.original.uploadedAt);
                return date.toLocaleDateString('vi-VN', {
                    day: 'numeric',
                    month: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                });
            } catch (e) {
                console.error("Invalid date:", e);
                return row.original.uploadedAt;
            }
        },
    },
    {
        id: "actions",
        // GỌI COMPONENT ĐÃ TÁCH Ở TRÊN
        cell: ({ row }) => <ActionCell row={row} />,
    }
];