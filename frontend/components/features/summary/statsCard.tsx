import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  ChevronUp,
  ChevronDown,
  Minus
} from 'lucide-react';

interface StatCardProps {
  icon: ReactNode;
  value: number | string; // Changed to allow formatted strings (e.g. "1,234")
  title: string;
  period: string;
  change?: number;
  unit?: string;
  className?: string; // Added for external styling flexibility
}

export default function StatCard({
  icon,
  value,
  title,
  period,
  change,
  unit = "",
  className
}: StatCardProps) {

  // --- Logic for 'change' prop ---
  const hasChangeValue = change !== undefined;

  let ChangeIcon = Minus;
  let changeColorClass = "text-muted-foreground bg-secondary"; // Default/Neutral

  if (hasChangeValue) {
    if (change > 0) {
      ChangeIcon = ChevronUp;
      // Using opacity (e.g., /15) allows this to work on both Light and Dark modes
      changeColorClass = "text-emerald-600 dark:text-emerald-400 bg-emerald-500/15";
    } else if (change < 0) {
      ChangeIcon = ChevronDown;
      changeColorClass = "text-rose-600 dark:text-rose-400 bg-rose-500/15";
    }
  }
  // --- End Logic ---

  return (
    <div className={cn(
      "flex flex-col px-5 py-4 bg-card text-card-foreground rounded-xl border border-border shadow-sm transition-all hover:shadow-md",
      className
    )}>

      {/* Header: Title and Icon */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">

          <span className="text-sm font-medium text-muted-foreground">
            {title}
          </span>

          {hasChangeValue ? (
            <div className={cn(
              "flex items-center gap-0.5 rounded-full px-2 py-1 text-xs font-medium",
              changeColorClass
            )}>
              <ChangeIcon className="h-3 w-3" strokeWidth={3} />
              <span>{Math.abs(change)}%</span>
            </div>
          ) : (
            // Placeholder to keep alignment if needed, or render nothing
            <div className="h-6" />
          )}
        </div>

        {/* Icon wrapper for consistent sizing and muted color */}
        <div className="p-2 rounded-md bg-secondary/50 text-foreground/70">
          {icon}
        </div>

      </div>

      {/* Main Value */}
      <div className='w-full flex justify-between items-end'>
        
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-3xl font-bold tracking-tight">
          {value}
        </span>
        {unit && (
          <span className="text-sm font-medium text-muted-foreground">
            {unit}
          </span>
        )}
      </div>

      {/* Footer: Change Badge and Period */}

        <p className="text-xs text-muted-foreground">
          {period}
        </p>
      </div>
    </div>
  );
}