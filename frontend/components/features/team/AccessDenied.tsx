import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AccessDeniedState({ message }: { message: string }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center animate-in fade-in zoom-in-95 duration-300">
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-full">
        <ShieldAlert className="w-12 h-12 text-red-600 dark:text-red-400" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Access Restricted</h2>
        <p className="text-muted-foreground max-w-md">
          {message ||
            "You don't have permission to access this team's backlog."}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
        <Button onClick={() => router.push("/dashboard")}>
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
