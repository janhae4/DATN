// components/epic/EpicDataTable.tsx
"use client"

import * as React from "react"
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Plus, ChevronRight, PlusCircle } from "lucide-react" // THÊM PlusCircle
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Epic } from "@/lib/types/epic.type"
import { Task } from "@/lib/types/task.type"
import { initialEpicData } from "@/public/mock-data/epic-data"
import { initialData as allTasks } from "@/public/mock-data/task-data"
import { EpicTaskTable } from "./EpicTaskTable"
import { getEpicColumns } from "./EpicColumns"
import { EpicModal } from "./EpicModal"

export function EpicDataTable() {
    const [data, setData] = React.useState<Epic[]>(initialEpicData)
    const [isAddingNewRow, setIsAddingNewRow] = React.useState(false)
    const [newRowTitle, setNewRowTitle] = React.useState("")
    // --- THÊM: State cho modal ---
    const [selectedEpic, setSelectedEpic] = React.useState<Epic | null>(null)


    // --- Handlers ---
    const updateEpic = (epicId: string, updates: Partial<Epic>) => {
        setData((currentData) =>
            currentData.map((epic) =>
                epic.id === epicId ? { ...epic, ...updates } : epic
            )
        )
    }

    const handleStatusChange = (id: string, status: Task["status"]) => updateEpic(id, { status })
    const handlePriorityChange = (id: string, priority: Task["priority"]) => updateEpic(id, { priority })
    const handleDateChange = (id: string, key: "start_date" | "due_date", date: Date | undefined) => {
        updateEpic(id, { [key]: date ? date.toISOString() : null })
    }

    // --- THÊM: Handler để mở modal ---
    const handleOpenModal = React.useCallback((epic: Epic) => {
        setSelectedEpic(epic)
    }, [])

    const handleAddNewRow = () => {
        if (!newRowTitle.trim()) {
            setIsAddingNewRow(false); return;
        }
        const newEpic: Epic = {
            id: `EPIC-${Date.now()}`,
            title: newRowTitle.trim(),
            status: "todo",
            priority: null,
            owner: null,
            start_date: null,
            due_date: null,
        }
        setData(prev => [...prev, newEpic])
        setNewRowTitle("")
        setIsAddingNewRow(false)
    }

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") handleAddNewRow()
        if (e.key === "Escape") setIsAddingNewRow(false)
    }
    // --- Hết Handlers ---

    const columns = React.useMemo(
        // --- THAY ĐỔI: Truyền handleOpenModal ---
        () => getEpicColumns(handleStatusChange, handlePriorityChange, handleDateChange, handleOpenModal),
        [handleOpenModal] // Thêm dependency
    )

    const table = useReactTable({
        data,
        columns,
        getRowId: (row) => row.id,
        getCoreRowModel: getCoreRowModel(),
    })

    return (
        <div className="w-full">
            <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
                <AccordionItem value="item-1" className="border-b-0">
                    <AccordionTrigger className="px-4 items-center py-2 bg-muted/50 hover:no-underline transition-all">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-lg">Epics</span>
                            <span className="text-md text-muted-foreground">({data.length} items)</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-2 bg-muted/50">
                        <div className="overflow-hidden border bg-white rounded-md">
                            <Table>                             

                                <TableBody>
                                    {table.getRowModel().rows.map((row) => {
                                        const epic = row.original
                                        const tasksForEpic = allTasks.filter(task => task.epic === epic.title)

                                        return (
                                            <Collapsible asChild key={row.id}>
                                                <React.Fragment>
                                                    {/* Hàng 1: Trigger (Epic Row) */}
                                                    <CollapsibleTrigger asChild>
                                                        <TableRow className="cursor-pointer hover:bg-muted/50 data-[state=open]:bg-muted/50 data-[state=open]:border-b-0 group">
                                                            {row.getVisibleCells().map((cell) => (
                                                                <TableCell key={cell.id} className="py-1" style={{ width: cell.column.getSize() !== 150 ? `${cell.column.getSize()}px` : 'auto' }}>
                                                                    {cell.column.id === 'title' ? (
                                                                        <div className="flex items-center gap-2">
                                                                            <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90 text-muted-foreground" />
                                                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                                        </div>
                                                                    ) : (
                                                                        flexRender(cell.column.columnDef.cell, cell.getContext())
                                                                    )}
                                                                </TableCell>
                                                            ))}
                                                        </TableRow>
                                                    </CollapsibleTrigger>

                                                    {/* Hàng 2: Content (Task Table Row) */}
                                                    <CollapsibleContent asChild>
                                                        <TableRow className="bg-white hover:bg-white">
                                                            <TableCell colSpan={columns.length} className="p-0">
                                                                {/* --- THAY ĐỔI: Thêm border-t và pt-2 --- */}
                                                                <div className="p-4 pt-2 bg-muted/40 border-t">
                                                                    {tasksForEpic.length > 0 ? (
                                                                        <EpicTaskTable tasks={tasksForEpic} />
                                                                    ) : (
                                                                        // --- THAY ĐỔI: Cải thiện UI "No tasks" ---
                                                                        <div className="flex items-center justify-center text-center text-muted-foreground p-4 gap-2">
                                                                            <PlusCircle className="h-4 w-4" />
                                                                            No tasks associated with this epic.
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    </CollapsibleContent>
                                                </React.Fragment>
                                            </Collapsible>
                                        )
                                    })}

                                    {/* Hàng "Add Epic" */}
                                    {isAddingNewRow ? (
                                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                                            <TableCell colSpan={columns.length} className="py-1">
                                                <div className="flex items-center gap-2 px-2">
                                                    <Input
                                                        placeholder="Tên Epic mới..."
                                                        value={newRowTitle}
                                                        onChange={(e) => setNewRowTitle(e.target.value)}
                                                        onKeyDown={handleInputKeyDown}
                                                        autoFocus
                                                        className="h-8 border-none focus-visible:ring-0 shadow-none bg-transparent"
                                                    />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={columns.length} className="cursor-pointer text-muted-foreground hover:bg-muted/50 h-10" onClick={() => setIsAddingNewRow(true)}>
                                                <div className="flex items-center px-2"><Plus className="h-4 w-4 mr-2" />Add Epic</div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            {/* --- THÊM: Modal để hiển thị chi tiết Epic --- */}
       
        </div>
    )
}