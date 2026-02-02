"use client";

import * as React from "react";
import {
  User as UserIcon,
  Phone,
  Mail,
  Briefcase,
  Zap,
  Target,
  Loader2,
  CheckCircle2,
  MoreHorizontal,
  Plus,
  Globe,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Provider } from "@/types/common/enums";
import { useAuth } from "@/contexts/AuthContext";
import { linkGoogleAccount, updateSkills } from "@/services/authService";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { SkillSelector } from "../auth/SkillSelector";
import { cn } from "@/lib/utils";

const POPULAR_SKILLS = [
  "React",
  "NodeJS",
  "TypeScript",
  "Figma",
  "Python",
  "SQL",
  "Tailwind",
  "Next.js",
  "Docker",
  "PostgreSQL",
  "AWS",
  "GraphQL",
];

export function ProfileHeaderAndGeneral() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const [editingSkills, setEditingSkills] = React.useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);


  React.useEffect(() => {
    refreshUser();
  }, []);

  React.useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  const openEditModal = () => {
    setEditingSkills(user?.skills?.map((s) => s.skillName) || []);
    setIsModalOpen(true);
  };

  const handleSaveSkills = async () => {
    setIsLoading(true);
    try {
      await updateSkills(editingSkills);
      await refreshUser();
      setIsModalOpen(false);
      toast.success("Skills updated successfully");
    } catch (error) {
      toast.error("Failed to update skills");
      return;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGeneral = () => {
    console.log("Saving General settings:", { name, phone });
    toast.success("Profile updated");
  };

  const isGoogleLinked = user?.accounts?.some(
    (acc) => acc.provider === Provider.GOOGLE
  );

  return (
    <div className="w-full mx-auto pb-20 animate-in fade-in duration-500">
      <div className="px-8 sm:px-12 pt-12 relative bor">
        {/* Header with Avatar and Actions */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6 mb-8 group/header">
          <div className="flex items-start gap-6">
            <div className="relative group">
              <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border border-zinc-200 dark:border-zinc-700 shadow-sm rounded-xl cursor-default bg-white dark:bg-zinc-800">
                <AvatarImage
                  src={user?.avatar}
                  alt={user?.name}
                  className="object-cover rounded-xl"
                />
                <AvatarFallback className="text-3xl rounded-xl bg-orange-50 text-orange-600 dark:bg-zinc-800 dark:text-zinc-200">
                  {user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="pt-2">
              <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-2">
                {user?.name}
              </h1>
              <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm">
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-default">
                  <Briefcase className="h-3.5 w-3.5 text-zinc-400" />
                  {user?.jobTitle || "Add job title"}
                </span>
              </div>
            </div>
          </div>

          {/* <div className="opacity-0 group-hover/header:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-zinc-400 hover:text-zinc-900"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div> */}
        </div>

        {/* Properties Section (Notion Style Grid) */}
        <div className="space-y-1 mb-12 max-w-2xl ">
          <PropertyRow
            icon={<UserIcon className="h-4 w-4" />}
            label="Display Name"
          >
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 focus-visible:ring-0 focus-visible:border-indigo-500 px-2 -ml-2 bg-transparent shadow-none transition-all font-medium text-zinc-800 dark:text-zinc-200"
              placeholder="Enter name"
            />
          </PropertyRow>

          <PropertyRow icon={<Mail className="h-4 w-4" />} label="Email">
            <div className="px-2 text-sm text-zinc-600 dark:text-zinc-400 truncate">
              {user?.email || "No email"}
            </div>
          </PropertyRow>

          {/* <PropertyRow icon={<Phone className="h-4 w-4" />} label="Phone">
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-8 border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 focus-visible:ring-0 focus-visible:border-indigo-500 px-2 -ml-2 bg-transparent shadow-none transition-all font-normal placeholder:text-zinc-300"
              placeholder="Add phone..."
            />
          </PropertyRow> */}

          <PropertyRow
            icon={<Globe className="h-4 w-4" />}
            label="Google Account"
          >
            <div className="px-2 flex items-center h-8">
              {isGoogleLinked ? (
                <div className="flex items-center gap-2 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors cursor-default border border-transparent dark:border-blue-900/30">
                  <GoogleIcon className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">Connected</span>
                  <CheckCircle2 className="h-3 w-3 ml-1 opacity-60" />
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={linkGoogleAccount}
                  className="h-7 text-xs font-normal text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 -ml-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Connect Google
                </Button>
              )}
            </div>
          </PropertyRow>

          {/* <div className="pt-2 pl-[140px]">
            <Button
              size="sm"
              onClick={handleSaveGeneral}
              className="h-7 text-xs bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Update Profile
            </Button>
          </div> */}
        </div>

        {/* Skills Section - Board View Style */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-2 group border-b border-zinc-200 dark:border-zinc-800 pb-2">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Target className="h-4 w-4 text-zinc-500" />
              Expertise & Skills
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={openEditModal}
              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            >
              <MoreHorizontal className="h-4 w-4 mr-1" />
              Configure
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {user?.skills?.length === 0 && (
              <div className="col-span-full py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col items-center justify-center text-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/50">
                <p className="text-xs mb-3">No skills listed</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openEditModal}
                  className="h-7 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Skills
                </Button>
              </div>
            )}

            {user?.skills?.map((skill: any) => (
              <div
                key={skill.id}
                className={cn(
                  "group relative p-3 rounded-lg border transition-all cursor-default select-none",
                  "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800",
                  "hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                      {skill.skillName.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                      {skill.skillName}
                    </span>
                  </div>
                  {skill.isInterest && (
                    <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  )}
                </div>

                {/* Notion-style Progress Bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-zinc-400 dark:bg-zinc-600 group-hover:bg-indigo-500 transition-colors"
                      style={{ width: `${(skill.experience % 100) || 10}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">
                    Lvl.{Math.floor(skill.level)}
                  </span>
                </div>
              </div>
            ))}

            <button
              onClick={openEditModal}
              className="flex items-center justify-center h-full min-h-[80px] rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all text-xs font-medium"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add Skill
            </button>
          </div>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden border-zinc-200 dark:border-zinc-800 shadow-xl">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-xl font-semibold tracking-tight">
              Manage Expertise
            </DialogTitle>
            <DialogDescription className="text-zinc-500">
              Select technologies you are proficient in.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 pt-2">
            <SkillSelector
              selectedSkills={editingSkills}
              popularSkills={POPULAR_SKILLS}
              onChange={(newSkills) => setEditingSkills(newSkills)}
              onBack={() => setIsModalOpen(false)}
              showFooter={false}
            />
          </div>
          <DialogFooter className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveSkills}
              disabled={isLoading}
              className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              {isLoading && <Loader2 className="animate-spin h-3.5 w-3.5 mr-2" />}
              Save Updates
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Sub-components for cleaner code
function PropertyRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-start py-1.5 group">
      <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm h-8">
        <span className="opacity-70 group-hover:opacity-100 transition-opacity">
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </div>
      <div className="min-h-[32px] flex items-center w-full">{children}</div>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
