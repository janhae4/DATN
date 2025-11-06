import { Tag } from "lucide-react";
import { DetailRow } from "@/components/shared/DetailRow";

interface TaskLabelsProps {
  labelIds?: string[];
  onLabelsChange?: (labelIds: string[]) => void;
}

export function TaskLabels({ labelIds = [] }: TaskLabelsProps) {
  // This is a simplified version - you might want to fetch labels from context or props
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Labels</h3>
      <div className="space-y-4 rounded-md border p-4">
        <DetailRow icon={<Tag className="h-4 w-4" />} label="Labels">
          <div className="flex flex-wrap gap-2">
            {labelIds.length > 0 ? (
              labelIds.map((labelId) => (
                <span
                  key={labelId}
                  className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {labelId}
                </span>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">No labels</span>
            )}
          </div>
        </DetailRow>
      </div>
    </div>
  );
}
