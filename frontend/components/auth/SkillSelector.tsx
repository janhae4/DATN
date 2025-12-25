import * as React from "react";
import { Target, X, Sparkles, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SkillSelectorProps {
  selectedSkills: string[];
  popularSkills: string[];
  onChange: (skills: string[]) => void;
  error?: string;
  loading?: boolean;
  onBack: () => void;
  showFooter?: boolean;
}

export function SkillSelector({
  selectedSkills,
  popularSkills,
  onChange,
  error,
  loading,
  onBack,
  showFooter = true,
}: SkillSelectorProps) {
  const [customSkill, setCustomSkill] = React.useState("");

  const addSkillAction = () => {
    if (customSkill.trim()) {
      const newSkill = customSkill.trim();
      const exists = selectedSkills.some(
        (s) => s.toLowerCase() === newSkill.toLowerCase()
      );

      if (!exists) {
        onChange([...selectedSkills, newSkill]);
        toast.success(`Added "${newSkill}"`);
        setCustomSkill("");
      } else {
        toast.error("This skill is already in your list");
      }
    }
  };

  const toggleInterest = (skill: string) => {
    const next = selectedSkills.includes(skill)
      ? selectedSkills.filter((i) => i !== skill)
      : [...selectedSkills, skill];
    onChange(next);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
            <Target size={20} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Focus Areas</h1>
        </div>
        <p className="text-zinc-500 text-sm">
          Select from the list or type your own custom skills to build your
          profile.
        </p>
      </div>

      <div className="space-y-4">
        {/* Custom Skill Input */}
        <div className="relative group">
          <Input
            placeholder="Type a skill (e.g. Golang, AWS...) and press Enter"
            value={customSkill}
            onChange={(e) => setCustomSkill(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && (e.preventDefault(), addSkillAction())
            }
            className="h-11 pr-16 focus-visible:ring-indigo-500"
          />
          <button
            type="button"
            onClick={addSkillAction}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold 
              text-zinc-500 bg-zinc-100 px-2 py-1 rounded border 
              hover:bg-zinc-200 hover:text-zinc-700 active:scale-95 
              transition-all cursor-pointer z-10"
          >
            ENTER
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">
              Suggested for you
            </Label>
            <div className="flex flex-wrap gap-2">
              {popularSkills.map((skill) => (
                <Badge
                  key={skill}
                  variant={
                    selectedSkills.includes(skill) ? "default" : "outline"
                  }
                  className={cn(
                    "cursor-pointer px-3 py-1.5",
                    selectedSkills.includes(skill)
                      ? "bg-zinc-900"
                      : "hover:border-zinc-400"
                  )}
                  onClick={() => toggleInterest(skill)}
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          {selectedSkills.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <Label className="text-[10px] uppercase text-indigo-500 font-bold">
                Selected Skills
              </Label>
              <div className="flex flex-wrap gap-2">
                {selectedSkills.map((skill) => (
                  <Badge
                    key={skill}
                    className="bg-indigo-50 text-indigo-700 border-indigo-200 px-3 py-1.5 flex items-center justify-between gap-2 group transition-all"
                  >
                    <span className="select-none">{skill}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleInterest(skill);
                      }}
                      className="flex items-center justify-center bg-indigo-200/40 rounded-full p-0.5 
                        hover:bg-indigo-200 hover:text-indigo-900 transition-colors cursor-pointer"
                    >
                      <X size={12} strokeWidth={2.5} />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {error && <p className="text-red-500 text-xs">{error}</p>}
        </div>
      </div>

      {showFooter && (
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="ghost"
            className="flex-1 h-11"
            onClick={onBack}
          >
            Back
          </Button>
          <Button
            type="submit"
            className="flex-[2] h-11 bg-zinc-900"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="animate-spin h-4 w-4" />
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" /> Complete Profile
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
