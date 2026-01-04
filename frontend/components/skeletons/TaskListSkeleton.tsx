import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

export function TaskListSkeleton() {
  return (
    <div className="w-full border rounded-md">
      <Table>
        <TableBody>
          {Array.from({ length: 8 }).map((_, index) => (
            <TableRow key={index} className="hover:bg-transparent">
              <TableCell className="w-full py-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-4 rounded" />

                  <Skeleton className="h-4 w-4 rounded-full" />

                  <Skeleton
                    className="h-5 rounded-md"
                    style={{
                      width: `${Math.floor(
                        Math.random() * (300 - 150 + 1) + 150
                      )}px`,
                    }}
                  />
                </div>
              </TableCell>

              <TableCell className="w-fit">
                <div className="flex gap-1">
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
              </TableCell>

              <TableCell className="w-fit">
                <Skeleton className="h-6 w-20 rounded-md" />
              </TableCell>

              <TableCell className="w-fit">
                <Skeleton className="h-6 w-24 rounded-md" />
              </TableCell>

              <TableCell className="w-fit">
                <Skeleton className="h-5 w-5 rounded-md" />
              </TableCell>

              <TableCell className="w-fit">
                <Skeleton className="h-6 w-6 rounded-full" />
              </TableCell>

              <TableCell className="w-[100px]">
                <Skeleton className="h-5 w-16 rounded-md" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
