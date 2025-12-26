import { Briefcase, ChevronRight } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UseFormRegister, UseFormSetValue } from "react-hook-form";

interface JobTitleSelectorProps {
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  currentTitle: string;
  suggestions: string[];
  error?: string;
  onNext: () => void;
}

export function JobTitleSelector({
  register,
  setValue,
  currentTitle,
  suggestions,
  error,
  onNext,
}: JobTitleSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-10 w-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white dark:bg-zinc-100 dark:text-zinc-900">
          <Briefcase size={20} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Your Identity</h1>
        <p className="text-zinc-500 text-sm">
          How should we identify your professional role?
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Job Title</Label>
          <Input
            {...register("jobTitle")}
            id="title"
            placeholder="e.g. Senior Backend Engineer"
            className={cn(
              "h-11",
              error && "border-red-500 focus-visible:ring-red-500"
            )}
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
        </div>

        <div className="flex flex-wrap gap-2">
          {suggestions.map((title) => (
            <button
              type="button"
              key={title}
              onClick={() =>
                setValue("jobTitle", title, { shouldValidate: true })
              }
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border transition-all",
                currentTitle === title
                  ? "bg-zinc-900 text-white"
                  : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
              )}
            >
              {title}
            </button>
          ))}
        </div>
      </div>

      <Button
        type="button"
        className="w-full h-11 bg-zinc-900"
        onClick={onNext}
      >
        Continue <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
