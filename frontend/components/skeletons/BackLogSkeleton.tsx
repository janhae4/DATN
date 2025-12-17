import { Skeleton } from "@/components/ui/skeleton";

export function BacklogSkeleton() {
  return (
    <div className="flex flex-col gap-4 w-full h-full p-4">
      {/* Filter Bar Skeleton */}
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-24" /> 
        <Skeleton className="h-9 w-24" />
      </div>

      {/* Accordion Items Skeleton */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <div className="flex items-center justify-between bg-muted/30 p-2 rounded">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-6 w-48" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
          
          <div className="pl-4 space-y-1">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
