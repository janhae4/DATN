"use client"

import * as React from "react"
import { Task } from "@/types"
import { List } from "@/types"
import { UpdateTaskDto } from "@/services/taskService"

import { KanbanCard } from "./KanbanCard"
import { useDroppable } from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

import { Plus, MoreHorizontal, ArrowLeft, ArrowRight, Pencil, Circle, Clock, CheckCircle2, Trash2, Settings2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { KanbanAddNewCard } from "./KanbanAddNewCard"
import { motion, AnimatePresence } from "framer-motion"
import { ListCategoryEnum } from "@/types/common/enums"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import { ListEditDialog } from "@/components/shared/list/ListEditDialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface KanbanColumnProps {
  projectId: string
  list: List
  tasks: Task[]
  sprintId: string
  allLists: List[]
  onListUpdate?: () => void
  onMoveLeft?: () => void
  onMoveRight?: () => void
  onDeleteList?: () => void
  onUpdateLimit?: (limit: number | null) => void
}

export function KanbanColumn({ projectId, list, tasks, sprintId, allLists, onListUpdate, onMoveLeft, onMoveRight, onDeleteList, onUpdateLimit }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: list.id,
    data: {
      type: "KANBAN_COLUMN",
      list: list,
    },
  });

  const [isAdding, setIsAdding] = React.useState(false)
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const [limitInput, setLimitInput] = React.useState(list.limited?.toString() || "")
  
  React.useEffect(() => {
    setLimitInput(list.limited?.toString() || "")
  }, [list.limited])

  const handleSaveLimit = () => {
    const limit = parseInt(limitInput)
    if (!isNaN(limit) && limit > 0) {
      onUpdateLimit?.(limit)
    } else {
      onUpdateLimit?.(null)
    }
    setIsMenuOpen(false)
  }

  const taskIds = React.useMemo(() => tasks.map((t) => t.id), [tasks]);
  const isDoneColumn = list.category === ListCategoryEnum.DONE;
  
  // SỬA: Chỉ tính quá hạn mức nếu có limit và limit > 0
  const hasLimit = typeof list.limited === 'number' && list.limited > 0;
  const isLimitExceeded = hasLimit && tasks.length > list.limited!;
  
  const isFirst = allLists[0]?.id === list.id;
  const isLast = allLists[allLists.length - 1]?.id === list.id;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "group flex flex-col w-80 flex-shrink-0 bg-secondary rounded-xl border border-transparent h-full max-h-full transition-all duration-500",
         isOver 
           ? (isDoneColumn 
               ? "bg-green-500/10 border-green-500/30 ring-2 ring-green-500/20" 
               : "bg-secondary/60 border-primary/20 ring-2 ring-primary/10")
           : (isLimitExceeded ? "bg-red-500/5 border-red-500/20" : "")
      )}
    >
      {/* Header */}
      <div className="flex sticky bg-secondary! mb-2   rounded-t-xl   top-0 z-10 items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-2.5">
           {list.category === ListCategoryEnum.TODO && (
             <TooltipProvider>
               <Tooltip>
                 <TooltipTrigger>
                   <Circle className="h-4 w-4 text-muted-foreground" />
                 </TooltipTrigger>
                 <TooltipContent>
                   <p>To Do</p>
                 </TooltipContent>
               </Tooltip>
             </TooltipProvider>
           )}
           {list.category === ListCategoryEnum.IN_PROGRESS && (
             <TooltipProvider>
               <Tooltip>
                 <TooltipTrigger>
                   <Clock className="h-4 w-4 text-blue-500" />
                 </TooltipTrigger>
                 <TooltipContent>
                   <p>In Progress</p>
                 </TooltipContent>
               </Tooltip>
             </TooltipProvider>
           )}
           {list.category === ListCategoryEnum.DONE && (
             <TooltipProvider>
               <Tooltip>
                 <TooltipTrigger>
                   <CheckCircle2 className="h-4 w-4 text-green-500" />
                 </TooltipTrigger>
                 <TooltipContent>
                   <p>Done</p>
                 </TooltipContent>
               </Tooltip>
             </TooltipProvider>
           )}
           <h3 className="font-semibold text-sm text-foreground/90">{list.name}</h3>
           
           <Badge variant="secondary" className={cn(
             "ml-1 px-1.5 py-0 h-5 text-[10px] font-bold text-muted-foreground bg-background shadow-sm",
             isLimitExceeded && "text-destructive bg-destructive/10"
           )}>
             {tasks.length}
             {/* Chỉ hiện limit nếu có */}
             {hasLimit ? ` / ${list.limited}` : ""}
           </Badge>

           {/* Chỉ hiện icon cảnh báo nếu quá limit */}
           {isLimitExceeded && (
             <TooltipProvider>
               <Tooltip>
                 <TooltipTrigger>
                   <AlertCircle className="h-4 w-4 text-destructive" />
                 </TooltipTrigger>
                 <TooltipContent>
                   <p>WIP Limit Exceeded!</p>
                 </TooltipContent>
               </Tooltip>
             </TooltipProvider>
           )}
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
          
          {!isDoneColumn && (
            <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled={isFirst} onClick={onMoveLeft}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Move Left
                </DropdownMenuItem>
                <DropdownMenuItem disabled={isLast} onClick={onMoveRight}>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Move Right
                </DropdownMenuItem>
                
                {!isDoneColumn && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Settings2 className="mr-2 h-4 w-4" />
                      Set Limit
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="p-3 w-60">
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label htmlFor="limit" className="text-xs font-medium">
                            Max tasks
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="limit"
                              type="number"
                              value={limitInput}
                              onChange={(e) => setLimitInput(e.target.value)}
                              className="h-8"
                              placeholder="No limit"
                              min="1"
                              onKeyDown={(e) => e.stopPropagation()}
                            />
                            <Button size="sm" onClick={handleSaveLimit} className="h-8">
                              Save
                            </Button>
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Leave empty to remove limit.
                        </p>
                      </div>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                )}

                <ListEditDialog 
                  projectId={projectId} 
                  lists={allLists} 
                  initialListId={list.id}
                >
                   <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                     <Pencil className="mr-2 h-4 w-4" />
                     Edit
                   </DropdownMenuItem>
                </ListEditDialog>
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={onDeleteList}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-3 pb-3">
         <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
           <div className="flex flex-col gap-2.5 min-h-[100px]">
             {tasks.length > 0 ? (
               tasks.map((task) => (
                 <KanbanCard key={task.id} task={task} lists={allLists} />
               ))
             ) : (
               !isAdding && (
                 <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-muted-foreground/10 rounded-lg bg-background/20 text-muted-foreground/50">
                   <span className="text-sm font-medium">No tasks</span>
                   <span className="text-xs">Drop tasks here</span>
                 </div>
               )
             )}
             
             <AnimatePresence mode="wait">
               {isAdding ? (
                 <motion.div
                   key="add-new-card"
                   initial={{ opacity: 0, y: -10, height: 0 }}
                   animate={{ opacity: 1, y: 0, height: "auto" }}
                   exit={{ opacity: 0, y: -10, height: 0 }}
                   transition={{ duration: 0.2 }}
                 >
                   <KanbanAddNewCard 
                     listId={list.id} 
                     projectId={projectId}
                     sprintId={sprintId}
                     onCancel={() => setIsAdding(false)} 
                   />
                 </motion.div>
               ) : (
                 <motion.button 
                    key="add-button"
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => setIsAdding(true)}
                    className="hidden group-hover:block transition-all cursor-pointer duration-200 items-center gap-2 p-3 rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5 text-sm font-medium text-muted-foreground hover:text-primary w-full text-left mt-1"
                 >
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create new task
                  </div>
                 </motion.button>
               )}
             </AnimatePresence>
           </div>
         </SortableContext>
      </div>
    </div>
  );
}