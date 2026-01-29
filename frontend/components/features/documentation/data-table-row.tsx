// "use client";

// import { useState } from "react";
// import { Row, flexRender } from "@tanstack/react-table";
// import { TableCell, TableRow } from "@/components/ui/table";
// import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu";
// import { useDraggable, useDroppable } from "@dnd-kit/core";
// import { CSS } from "@dnd-kit/utilities";
// import { cn } from "@/lib/utils";

// import { AssigneeDialog } from "@/components/shared/assignee/AsigneeModal";
// import { Attachment, AttachmentType, FileVisibility, Member } from "@/types";
// import { ContextFileMenuContent } from "./file-card";

// interface DataTableRowProps {
//   row: Row<Attachment>;
//   members: Member[];
//   projectId?: string;
//   teamId?: string;
//   onPreview: (file: Attachment) => void;
//   onDownload: (id: string) => void;
//   onDelete: (id: string) => void;
//   onVisibilityChange: (
//     ids: string[],
//     vis: FileVisibility,
//     allowed?: string[],
//   ) => void;
//   onBulkDownload?: (ids: string[]) => void;
//   onBulkDelete?: (ids: string[]) => void;
//   selectedIds: Set<string>;
//   setSelectedIds: (ids: Set<string>) => void;
// }

// export function DataTableRow({
//   row,
//   members,
//   projectId,
//   teamId,
//   onPreview,
//   onDownload,
//   onDelete,
//   onVisibilityChange,
//   onBulkDownload,
//   onBulkDelete,
//   selectedIds,
//   setSelectedIds,
// }: DataTableRowProps) {
//   const file = row.original;
//   const [isAssigneeModalOpen, setIsAssigneeModalOpen] = useState(false);

//   // --- LOGIC DRAG & DROP (DND-KIT) ---
//   const { attributes, listeners, setNodeRef, transform, isDragging } =
//     useDraggable({
//       id: file.id,
//       data: file,
//     });

//   const { setNodeRef: setDroppableRef, isOver } = useDroppable({
//     id: file.id,
//     data: file,
//     // Chỉ cho phép drop vào Folder
//     disabled:
//       file.fileType !== AttachmentType.FOLDER,
//   });

//   const style = {
//     transform: CSS.Translate.toString(transform),
//     opacity: isDragging ? 0.3 : 1,
//     zIndex: isDragging ? 999 : "auto",
//     position: isDragging ? ("relative" as const) : ("static" as const),
//   };

//   const setRefs = (node: HTMLTableRowElement | null) => {
//     setNodeRef(node);
//     setDroppableRef(node);
//   };
//   // -----------------------------------

//   const handleContextMenu = (e: React.MouseEvent) => {
//     if (!row.getIsSelected()) {
//       row.toggleSelected(true);
//     }
//   };

//   const handleChangeVisibility = (
//     newVis: FileVisibility,
//     newAllowed?: string[],
//   ) => {
//     if (row.getIsSelected() && selectedIds.size > 1) {
//       onVisibilityChange(Array.from(selectedIds), newVis, newAllowed);
//     } else {
//       onVisibilityChange([file.id], newVis, newAllowed);
//     }
//   };

//   return (
//     <>
//       <ContextMenu>
//         <ContextMenuTrigger asChild onContextMenu={handleContextMenu}>
//           <TableRow
//             ref={setRefs} 
//             style={style} 
//             {...attributes}
//             {...listeners} 
//             data-state={row.getIsSelected() && "selected"}
//             className={cn(
//               "group cursor-pointer hover:bg-muted/50",
//               isOver &&
//                 "bg-blue-100 dark:bg-blue-900/40 border-2 border-dashed border-blue-500", // UI khi kéo file đè lên folder
//             )}
//           >
//             {row.getVisibleCells().map((cell) => (
//               <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
//                 {flexRender(cell.column.columnDef.cell, cell.getContext())}
//               </TableCell>
//             ))}
//           </TableRow>
//         </ContextMenuTrigger>

//         <ContextFileMenuContent
//           selectedIds={
//             row.getIsSelected() && selectedIds.size > 0
//               ? selectedIds
//               : new Set([file.id])
//           }
//           projectId={projectId}
//           teamId={teamId}
//           currentVisibility={file.visibility}
//           onPreview={onPreview}
//           onDownload={onDownload}
//           onDelete={onDelete}
//           onChangeVisibility={handleChangeVisibility}
//           setIsAssigneeModalOpen={setIsAssigneeModalOpen}
//           onBulkDownload={onBulkDownload}
//           onBulkDelete={onBulkDelete}
//         />
//       </ContextMenu>

//       <AssigneeDialog
//         open={isAssigneeModalOpen}
//         onOpenChange={setIsAssigneeModalOpen}
//         users={members}
//         value={file.allowedUserIds || []}
//         onChange={(userIds) =>
//           handleChangeVisibility(FileVisibility.SPECIFIC, userIds)
//         }
//       />
//     </>
//   );
// }
