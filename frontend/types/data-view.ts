import { ColumnDef } from "@tanstack/react-table";
import { Attachment, FileVisibility } from "./project";
import { Member } from "./social";

export interface PaginationState {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export interface DataViewProps<TData, TValue = any> {
    data: TData[]
    isLoading?: boolean
    pagination?: PaginationState
    tableColumns?: ColumnDef<TData, TValue>[]
    onPreview: (file: Attachment) => void;
    onDownload: (id: string) => void;
    onDelete: (id: string) => void;
    onVisibilityChange: (ids: string[], vis: FileVisibility, allowed?: string[]) => void;
    members: Member[];
    projectId?: string;
    teamId?: string;
    renderGridItem?: (item: TData) => React.ReactNode
    gridConfig?: {
        default?: number;
        sm?: number;
        md?: number;
        lg?: number;
        xl?: number;
        "2xl"?: number;
    }
}