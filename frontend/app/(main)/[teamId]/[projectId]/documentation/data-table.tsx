"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  // Bỏ getPaginationRowModel vì ta tự quản lý
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageCount: number;   
  pageIndex: number;      // Trang hiện tại (Lưu ý: Backend thường là 1, nhưng Table này dùng 0-index)
  onPageChange: (page: number) => void; // Hàm callback khi đổi trang
  isLoading?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount,
  pageIndex,
  onPageChange,
  isLoading
}: DataTableProps<TData, TValue>) {
  console.log("Data trong table: ", data)
  const table = useReactTable({
    data,
    columns,
    pageCount: pageCount - 1, // Total number of pages (1-based)
    state: {
      pagination: {
        pageIndex: pageIndex - 1, // Convert to 0-based for internal use
        pageSize: 12, // Show 12 items per page
      },
    },
    manualPagination: true, // Use server-side pagination
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const currentIndex = pageIndex - 1;
        const newState = updater({
          pageIndex: currentIndex,
          pageSize: 12
        });
        onPageChange(Math.max(0, newState.pageIndex + 1));
      }
    },
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-md border bg-white dark:bg-zinc-950">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Loading data...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls - Matched with DataGrid */}
      {pageCount > 0 && (
        <div className="flex items-center justify-between border-t mb-3 border-zinc-100 dark:border-zinc-800 pt-4">
          <p className="text-sm text-zinc-500 font-medium">
            Page <span className="text-zinc-900 dark:text-zinc-200">{pageIndex + 1}</span> of <span className="text-zinc-900 dark:text-zinc-200">{pageCount}</span>
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pageIndex - 1)}
              disabled={pageIndex <= 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pageIndex + 1)}
              disabled={pageIndex >= pageCount}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}