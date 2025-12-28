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
  // Props cho phân trang (tùy chọn)
  pagination?: {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export function DataGrid<TData>({
  data,
  renderItem,
  columns = { default: 1, sm: 2, lg: 3, xl: 4, "2xl": 5 },
  pagination
}: DataGridProps<TData>) {
  
  // Tạo class grid responsive dựa trên props
  const gridColsClass = `
    grid gap-6 
    grid-cols-${columns.default}
    sm:grid-cols-${columns.sm || columns.default}
    md:grid-cols-${columns.md || columns.sm || columns.default}
    lg:grid-cols-${columns.lg || columns.md || columns.default}
    xl:grid-cols-${columns.xl || columns.lg || columns.default}
    2xl:grid-cols-${columns["2xl"] || columns.xl || columns.default}
  `.trim()

  return (
    <div className="space-y-6">
      {data.length > 0 ? (
        <div className={gridColsClass}>
          {data.map((item, index) => (
            <div key={index} className="animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${index * 50}ms` }}>
              {renderItem(item)}
            </div>
          ))}
        </div>
      ) : (
    <div className="flex flex-col items-center justify-center py-24 bg-slate-50/50 dark:bg-accent/50 rounded-3xl border border-dashed border-accent dark:border-slate-700">
  <div className="p-4 bg-white dark:bg-accent rounded-full shadow-sm mb-4">
    <Inbox className="h-8 w-8 text-slate-300 dark:text-slate" />
  </div>
  <p className="text-slate-500  font-medium text-lg">No items found</p>
  <p className="text-slate-400 text-sm">Try adjusting your filters to find what you're looking for.</p>
</div>
      )}

      {/* Pagination UI */}
      {pagination && (
        <div className="flex items-center justify-between px-2 pt-4 border-t ">
          <p className="text-sm text-slate-500 font-medium">
            Page <span className="text-slate-900">{pagination.currentPage}</span> of <span className="text-slate-900">{pagination.totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl h-9 px-4 border-slate-200 bg-white"
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPreviousPage}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl h-9 px-4 border-slate-200 bg-white"
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}