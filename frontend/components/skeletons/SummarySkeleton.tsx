import { Skeleton } from "@/components/ui/skeleton";

export function SummarySkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4 pt-0">
      <div className="grid auto-rows-min gap-4 md:grid-cols-4 sm:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border bg-card text-card-foreground shadow p-6 space-y-2"
          >
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" /> {/* Title */}
              <Skeleton className="h-4 w-4" /> {/* Icon */}
            </div>
            <div className="space-y-1">
              <Skeleton className="h-8 w-12" /> {/* Value */}
              <Skeleton className="h-3 w-32" /> {/* Description */}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-background rounded-xl w-full h-[350px] shadow-sm border p-6 flex flex-col gap-4">
          <Skeleton className="h-6 w-48 mx-auto" /> 
          <Skeleton className="h-64 w-64 rounded-full mx-auto" /> 
        </div>
        <div className="bg-background rounded-xl w-full h-[350px] shadow-sm border p-6 flex flex-col gap-4">
          <Skeleton className="h-6 w-48" /> 
          <div className="flex items-end justify-between gap-2 h-64 w-full">
            <Skeleton className="h-1/3 w-full" />
            <Skeleton className="h-2/3 w-full" />
            <Skeleton className="h-1/2 w-full" />
            <Skeleton className="h-3/4 w-full" />
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Skeleton className="aspect-video w-full rounded-xl" />
        <Skeleton className="aspect-video w-full rounded-xl" />
      </div>
    </div>
  );
}
