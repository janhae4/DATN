"use client";

import { DataViewProps } from "@/types/data-view";
import { DataGrid } from "../features/documentation/data-grid";
import { DataTable } from "../features/documentation/data-table";
import { Attachment } from "@/types";

interface UnifiedDataViewProps<
  TData extends { id: string },
  TValue = any,
> extends DataViewProps<TData, TValue> {
  mode: "grid" | "table";
}

export function DataView<TData extends Attachment, TValue>({
  mode,
  ...props
}: UnifiedDataViewProps<TData, TValue>) {
  if (mode === "grid") {
    return <DataGrid<TData> {...props} />;
  }

  return <DataTable<TData, TValue> {...props} />;
}
