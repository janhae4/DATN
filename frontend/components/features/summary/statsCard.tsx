import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  icon: ReactNode;
  value: number | string;
  title: string;
  period: string;
  change?: number;
  unit?: string;
  className?: string;
}

export default function StatCard({
  icon,
  value,
  title,
  period,
  change,
  unit = "",
  className,
}: StatCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <div
      className={cn(
        "group relative overflow-hidden flex flex-col p-5 bg-background text-foreground rounded-2xl border border-border/60 shadow-sm transition-all duration-300 hover:shadow-md hover:border-border-strong",
        className
      )}
    >
      <div className="absolute top-0 right-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-primary/5 blur-3xl transition-opacity opacity-0 group-hover:opacity-100" />

      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300",
            "bg-secondary/50 text-muted-foreground ring-1 ring-border/50",
            "group-hover:bg-primary/10 group-hover:text-primary group-hover:ring-primary/30"
          )}
        >
          {icon}
        </div>

        {change !== undefined && (
          <div
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-bold tracking-tight shadow-sm",
              isPositive
                ? "text-emerald-600 bg-emerald-500/10"
                : isNegative
                ? "text-rose-600 bg-rose-500/10"
                : "text-muted-foreground bg-secondary"
            )}
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : isNegative ? (
              <TrendingDown className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
            <span>
              {isPositive ? "+" : ""}
              {change}%
            </span>
          </div>
        )}
      </div>

      <div className="mt-5 space-y-1">
        <p className="text-sm font-medium text-muted-foreground/80 lowercase first-letter:uppercase tracking-tight">
          {title}
        </p>
        <div className="flex items-baseline gap-1">
          <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {value}
          </h3>
          {unit && (
            <span className="text-sm font-semibold text-muted-foreground/60 mb-1">
              {unit}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border/40">
        <div className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground/50">
          <span className="h-1.5 w-1.5 rounded-full bg-primary/40" />
          {period}
        </div>
      </div>
    </div>
  );
}
