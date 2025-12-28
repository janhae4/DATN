"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react"

interface DataGridProps<TData> {
  data: TData[]
  renderItem: (item: TData) => React.ReactNode
  columns?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
    "2xl"?: number
  }
  // Cập nhật Pagination Props chuẩn
  pagination?: {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
  }
  isLoading?: boolean
}

export function DataGrid<TData>({
  data,
  renderItem,
  columns = { default: 1, sm: 2, lg: 3, xl: 4 }, // Chỉnh default grid hợp lý hơn
  pagination,
  isLoading
}: DataGridProps<TData>) {
  
  const gridColsClass = `
    grid gap-4 
    grid-cols-${columns.default}
    sm:grid-cols-${columns.sm || columns.default}
    md:grid-cols-${columns.md || columns.sm || columns.default}
    lg:grid-cols-${columns.lg || columns.md || columns.default}
    xl:grid-cols-${columns.xl || columns.lg || columns.default}
    2xl:grid-cols-${columns["2xl"] || columns.xl || columns.default}
  `.trim()

  if (isLoading) {
      return <div className="py-20 text-center text-sm text-zinc-500">Loading grid data...</div>
  }

  return (
    <div className="space-y-6">
      {data.length > 0 ? (
        <div className={gridColsClass}>
          {data.map((item, index) => (
            <div key={index} className="animate-in fade-in zoom-in-95 duration-200">
              {renderItem(item)}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-full shadow-sm mb-4">
                <Inbox className="h-8 w-8 text-zinc-300" />
            </div>
            <p className="text-zinc-500 font-medium">No files found</p>
        </div>
      )}

      {/* Pagination UI */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mb-3 border-t border-zinc-100 dark:border-zinc-800 pt-4">
          <p className="text-sm text-zinc-500 font-medium">
            Page <span className="text-zinc-900 dark:text-zinc-200">{pagination.currentPage}</span> of <span className="text-zinc-900 dark:text-zinc-200">{pagination.totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}