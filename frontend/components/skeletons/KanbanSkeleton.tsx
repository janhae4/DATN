import { Skeleton } from "@/components/ui/skeleton";

export function KanbanSkeleton() {
  return (
    <div className="flex gap-6 h-full w-full overflow-hidden p-4">
      {[1, 2, 3, 4].map((col) => (
        <div key={col} className="w-[300px] shrink-0 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-5 w-8 rounded-full" />
            </div>
            <Skeleton className="h-8 w-8" />
          </div>

          <div className="flex flex-col gap-3">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
