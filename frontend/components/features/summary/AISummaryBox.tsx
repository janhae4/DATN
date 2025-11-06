import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, RefreshCw } from "lucide-react"


export function AISummaryBox() {
  return (
    <Card className="w-full h-full flex justify-around">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Your Daily Briefing
        </CardTitle>
        <CardDescription>
          A smart summary of your most important items.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <p className="text-sm leading-relaxed">
          Good morning! It looks like your main focus today should be the
          <strong> urgent email from 'Your Boss'</strong> about Project Y.
          <br />
          <br />
          Don't forget you also have{" "}
          <strong>2 overdue tasks</strong> (like 'Submit report') and your
          'Team Meeting' is at 10:00 AM.
        </p>
      </CardContent>

      <CardFooter className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">
          Generated just now
        </p>
        <Button className="cursor-pointer" variant="ghost" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardFooter>
    </Card>
  )
}