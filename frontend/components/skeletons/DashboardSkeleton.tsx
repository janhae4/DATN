import { Skeleton } from "@/components/ui/skeleton";
import { BacklogSkeleton } from "./BackLogSkeleton";

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col h-full w-full gap-6">
      <div className="flex gap-2 border-b px-4 pt-2">
        <Skeleton className="h-9 w-24 rounded-t-lg" /> {/* Tab 1 */}
        <Skeleton className="h-9 w-24 rounded-t-lg" /> {/* Tab 2 */}
        <Skeleton className="h-9 w-24 rounded-t-lg" /> {/* Tab 3 */}
        <Skeleton className="h-9 w-24 rounded-t-lg" /> {/* Tab 4 */}
      </div>

      <div className="flex-1">
        <BacklogSkeleton />
      </div>
    </div>
  );
}
