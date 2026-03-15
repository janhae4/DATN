// "use client";

// import * as React from "react";
// import {
//   flexRender,
//   getCoreRowModel,
//   RowSelectionState,
//   useReactTable,
// } from "@tanstack/react-table";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";
// import { DataViewProps } from "@/types/data-view";
// // import { DataTableRow } from "./data-table-row";
// import { Attachment, FileVisibility, Member } from "@/types";
// import { Button } from "@/components/ui/button";
// interface DataTableProps<
//   TData extends Attachment,
//   TValue,
// > extends DataViewProps<TData, TValue> {
//   onPreview: (file: Attachment) => void;
//   onDownload: (id: string) => void;
//   onDelete: (id: string) => void;
//   onVisibilityChange: (
//     ids: string[],
//     vis: FileVisibility,
//     allowed?: string[],
//   ) => void;
//   members: Member[];
//   projectId?: string;
//   teamId?: string;
//   [key: string]: any;
// }

// export function DataTable<TData extends Attachment, TValue>({
//   data,
//   tableColumns,
//   pagination,
//   isLoading,
//   onPreview,
//   onDownload,
//   onDelete,
//   onVisibilityChange,
//   members,
//   projectId,
//   teamId,
// }: DataTableProps<TData, TValue>) {
//   const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
//   const table = useReactTable({
//     data,
//     columns: tableColumns || [],
//     state: {
//       pagination: {
//         pageIndex: pagination ? pagination.currentPage - 1 : 0,
//         pageSize: 12,
//       },
//       rowSelection,
//     },
//     pageCount: pagination ? pagination.totalPages : -1,
//     manualPagination: true,
//     enableRowSelection: true, 
//     onRowSelectionChange: setRowSelection,
//     getCoreRowModel: getCoreRowModel(),
//   });

//   return (
//     <div className="space-y-4">
//       <div className="overflow-y-scroll rounded-md border bg-white dark:bg-zinc-950">
//         <Table>
//           <TableHeader>
//             {table.getHeaderGroups().map((headerGroup) => (
//               <TableRow key={headerGroup.id}>
//                 {headerGroup.headers.map((header) => (
//                   <TableHead key={header.id}>
//                     {header.isPlaceholder
//                       ? null
//                       : flexRender(
//                           header.column.columnDef.header,
//                           header.getContext(),
//                         )}
//                   </TableHead>
//                 ))}
//               </TableRow>
//             ))}
//           </TableHeader>
//           <TableBody>
//             {isLoading ? (
//               <TableRow>
//                 <TableCell
//                   colSpan={tableColumns?.length}
//                   className="h-24 text-center text-zinc-500"
//                 >
//                   Loading data...
//                 </TableCell>
//               </TableRow>
//             ) : table.getRowModel().rows?.length ? (
//               table
//                 .getRowModel()
//                 .rows.map((row) => (
//                   <DataTableRow
//                     key={row.id}
//                     row={row}
//                     members={members}
//                     projectId={projectId}
//                     teamId={teamId}
//                     onPreview={onPreview}
//                     onDownload={onDownload}
//                     onDelete={onDelete}
//                     onVisibilityChange={onVisibilityChange}
//                     selectedIds={
//                       new Set(
//                         table
//                           .getSelectedRowModel()
//                           .rows.map((r) => r.original.id),
//                       )
//                     }
//                     setSelectedIds={(ids) => {}}
//                   />
//                 ))
//             ) : (
//               <TableRow>
//                 <TableCell
//                   colSpan={tableColumns?.length}
//                   className="h-32 text-center"
//                 >
//                   <div className="flex flex-col items-center justify-center text-zinc-500">
//                     <Inbox className="h-6 w-6 mb-2 text-zinc-300" />
//                     <span className="text-sm font-medium">
//                       No results found
//                     </span>
//                   </div>
//                 </TableCell>
//               </TableRow>
//             )}
//           </TableBody>
//         </Table>
//       </div>

//       {pagination && pagination.totalPages > 1 && (
//         <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-4">
//           {/* Pagination UI Code */}
//           <div className="flex items-center gap-2">
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() =>
//                 pagination.onPageChange(pagination.currentPage - 1)
//               }
//               disabled={pagination.currentPage <= 1}
//             >
//               <ChevronLeft className="h-4 w-4 mr-1" /> Previous
//             </Button>
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() =>
//                 pagination.onPageChange(pagination.currentPage + 1)
//               }
//               disabled={pagination.currentPage >= pagination.totalPages}
//             >
//               Next <ChevronRight className="h-4 w-4 ml-1" />
//             </Button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
