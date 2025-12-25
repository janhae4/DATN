import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, TrendingUp } from "lucide-react";

// 2. Stats Card
export function StatsCard({ title, value, icon: Icon, description, loading, trend, trendUp }: any) {
  return (
    <Card className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="p-2 bg-primary/10 rounded-full">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <div className="text-3xl font-bold tracking-tight">{value}</div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          {trend && (
            <span className={`text-xs font-medium flex items-center ${trendUp === true ? 'text-green-600' : trendUp === false ? 'text-red-600' : 'text-muted-foreground'}`}>
              {trendUp === true ? <TrendingUp className="h-3 w-3 mr-1" /> : trendUp === false ? <TrendingUp className="h-3 w-3 mr-1 rotate-180" /> : <Activity className="h-3 w-3 mr-1" />}
              {trend}
            </span>
          )}
          <p className="text-xs text-muted-foreground truncate ml-auto">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}