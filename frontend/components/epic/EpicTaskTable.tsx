// components/epic/EpicTaskTable.tsx
"use client"

import * as React from "react"
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Task } from "@/lib/types/task.type"
import { getSimpleTaskColumns } from "./EpicTaskColumns" 

interface EpicTaskTableProps {
    tasks: Task[]
}

export function EpicTaskTable({ tasks }: EpicTaskTableProps) {
    const columns = React.useMemo(() => getSimpleTaskColumns(), [])

    const table = useReactTable({
        data: tasks,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    return (
        <div className="w-full">
            <Table>
                {/* --- THAY ĐỔI: Xóa <TableHeader> --- */}
                {/* Không cần header cho bảng con, 
                    trông sẽ sạch sẽ hơn. 
                */}
           
                <TableBody>
                    {table.getRowModel().rows.map((row) => (
                        // --- THAY ĐỔI: Bỏ 'border' ---
                        <TableRow key={row.id} className="cursor-pointer hover:bg-background/50 border-none">
                            {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id} className="py-1">
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}