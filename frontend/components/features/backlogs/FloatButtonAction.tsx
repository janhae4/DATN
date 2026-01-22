import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Ban, CheckCircle2, Trash2, X } from "lucide-react";

interface Props {
  selectedIds: string[];
  pendingSelectedIds: string[];
  handleBulkStatusChange(status: "APPROVED" | "REJECTED"): void;
  handleDeleteSelected(): void;
  handleClearSelection(): void;
}

const FloatButtonAction = ({
  selectedIds,
  pendingSelectedIds,
  handleBulkStatusChange,
  handleDeleteSelected,
  handleClearSelection,
}: Props) => {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-10 duration-300">
      <div className="flex items-center gap-1 p-2 pl-4 pr-2 dark:bg-zinc-900 dark:text-zinc-50 bg-zinc-50 text-zinc-900 rounded-full shadow-2xl border border-zinc-200/20 ring-1 ring-black/5">
        {/* 1. Counter Section */}
        <div className="flex items-center gap-2 mr-2">
          <span className="flex items-center justify-center w-5 h-5 dark:bg-zinc-700 bg-zinc-200 rounded-full text-[10px] font-bold">
            {selectedIds.length}
          </span>
          <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500 hidden sm:inline-block">
            Selected
          </span>
        </div>

        <div className="h-6 w-[1px] bg-zinc-700 dark:bg-zinc-300 mx-1" />
        <div className="flex items-center gap-1">
          {pendingSelectedIds.length > 0 && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleBulkStatusChange("APPROVED")}
                    className="h-9 w-9 rounded-full hover:bg-emerald-500/20 hover:text-emerald-500 text-zinc-400 dark:text-zinc-600 transition-colors"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="bg-emerald-600 border-emerald-600 text-white"
                >
                  <p>Approve selected</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleBulkStatusChange("REJECTED")}
                    className="h-9 w-9 rounded-full hover:bg-orange-500/20 hover:text-orange-500 text-zinc-400 dark:text-zinc-600 transition-colors"
                  >
                    <Ban className="h-4.5 w-4.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="bg-orange-600 border-orange-600 text-white"
                >
                  <p>Reject selected</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDeleteSelected}
                className="h-9 w-9 rounded-full hover:bg-red-500/20 hover:text-red-500 text-zinc-400 dark:text-zinc-600 transition-colors"
              >
                <Trash2 className="h-4.5 w-4.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="bg-red-600 border-red-600 text-white"
            >
              <p>Delete selected</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="h-6 w-[1px] bg-zinc-700 dark:bg-zinc-300 mx-1" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearSelection}
              className="h-9 w-9 rounded-full dark:hover:bg-zinc-800 hover:bg-zinc-200 text-zinc-500 transition-colors"
            >
              <X className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Clear selection</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

export default FloatButtonAction;
