"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { DataViewProps } from "@/types/data-view";
import { cn } from "@/lib/utils";
import { DndItemWrapper } from "./dnd-item-wrapper";

// interface DataGridProps<TData> {
//   data: TData[]
//   renderItem: (item: TData) => React.ReactNode
//   columns?: {
//     default?: number
//     sm?: number
//     md?: number
//     lg?: number
//     xl?: number
//     "2xl"?: number
//   }
//   pagination?: {
//     currentPage: number
//     totalPages: number
//     onPageChange: (page: number) => void
//   }
//   isLoading?: boolean
// }

const gridCols = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
  8: "grid-cols-8",
  10: "grid-cols-10",
  12: "grid-cols-12",
};

export function DataGrid<TData extends { id: string }>({
  data,
  renderGridItem,
  gridConfig = { default: 1, sm: 2, lg: 3, xl: 4 },
  pagination,
  isLoading,
}: DataViewProps<TData>) {
  if (isLoading) {
    return (
      <div className="py-20 text-center text-sm text-zinc-500">
        Loading grid data...
      </div>
    );
  }
  const getGridClass = (cols?: number) =>
    gridCols[cols as keyof typeof gridCols] || "grid-cols-1";

  return (
    <div className="space-y-6">
      {data.length > 0 ? (
        <div
          className={cn(
            "grid gap-4",
            getGridClass(gridConfig.default),
            gridConfig.sm && `sm:${getGridClass(gridConfig.sm)}`,
            gridConfig.md && `md:${getGridClass(gridConfig.md)}`,
            gridConfig.lg && `lg:${getGridClass(gridConfig.lg)}`,
            gridConfig.xl && `xl:${getGridClass(gridConfig.xl)}`,
            gridConfig["2xl"] && `2xl:${getGridClass(gridConfig["2xl"])}`,
          )}
        >
          {data.map((item, index) => (
            <DndItemWrapper key={item.id} item={item as any}>
              <div className="animate-in fade-in zoom-in-95 duration-200 h-full">
                {renderGridItem ? renderGridItem(item) : JSON.stringify(item)}
              </div>
            </DndItemWrapper>
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

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mb-3 border-t border-zinc-100 dark:border-zinc-800 pt-4">
          <p className="text-sm text-zinc-500 font-medium">
            Page{" "}
            <span className="text-zinc-900 dark:text-zinc-200">
              {pagination.currentPage}
            </span>
            of{" "}
            <span className="text-zinc-900 dark:text-zinc-200">
              {pagination.totalPages}
            </span>
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                pagination.onPageChange(pagination.currentPage - 1)
              }
              disabled={pagination.currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                pagination.onPageChange(pagination.currentPage + 1)
              }
              disabled={pagination.currentPage >= pagination.totalPages}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
