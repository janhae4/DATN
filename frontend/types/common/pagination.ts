export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export class Pagination<T> {
    data: T[];
    total: number;
    limit?: number;
    page: number;
    totalPages: number;
    constructor(data: T[], total: number, page: number, totalPages: number) {
        this.data = data;
        this.total = total;
        this.page = page;
        this.totalPages = totalPages;
    }
}