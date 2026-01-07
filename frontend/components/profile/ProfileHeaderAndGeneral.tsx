"use client";

import * as React from "react";
import {
  User as UserIcon,
  Save,
  Upload,
  Briefcase,
  Zap,
  Target,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Provider } from "@/types/common/enums";
import { useAuth } from "@/contexts/AuthContext";
import { linkGoogleAccount, updateSkills } from "@/services/authService";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { SkillSelector } from "../auth/SkillSelector";
import { DialogDescription, DialogTitle } from "@radix-ui/react-dialog";

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
];

export function ProfileHeaderAndGeneral() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const [editingSkills, setEditingSkills] = React.useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

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
      toast.success("Skills updated!");
    } catch (error) {
      toast.error("Failed to update skills. Please try again.");
      return;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    console.log("Saving General settings:", { name, phone });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserIcon className="h-5 w-5" />
          Profile Information
        </CardTitle>
        <CardDescription>
          Manage your display name, email, and profile picture.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-zinc-50/50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
          <div className="relative group">
            <Avatar className="size-24 border-4 border-white dark:border-zinc-800 shadow-xl transition-transform duration-300 group-hover:scale-105">
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback className="text-2xl font-black bg-black text-white">
                {user?.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <label className="absolute bottom-0 right-0 p-1.5 bg-white dark:bg-zinc-800 rounded-full shadow-lg border border-zinc-100 dark:border-zinc-700 cursor-pointer hover:bg-zinc-50 transition-colors">
              <Upload className="h-4 w-4 text-zinc-600" />
            </label>
          </div>

          <div className="flex-1 space-y-3 text-center sm:text-left">
            <div>
              <h4 className="font-semibold text-md">{user?.name}</h4>
              <p className="text-sm text-zinc-500">{user?.email}</p>
            </div>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              <Button
                onClick={linkGoogleAccount}
                variant="outline"
                size="sm"
                className="h-8 text-xs font-semibold rounded-full"
              >
                {user?.provider === Provider.GOOGLE
                  ? "Google Linked"
                  : "Link Google Account"}
              </Button>
              <div className="flex items-center gap-1 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full text-[10px] font-semibold uppercase tracking-tighter">
                <Briefcase className="h-3 w-3" /> {user?.jobTitle || "No Role"}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user?.email}
              disabled
              className="bg-muted/50"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Optional phone number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jobTitle">Job Role</Label>
            <Input
              id="jobTitle"
              value={user?.jobTitle || "Not specified"}
              disabled
              className="bg-muted/50"
            />
          </div>
        </div>
        <Separator className="my-6" />

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-md font-semibold flex items-center gap-2 tracking-tight">
                <Target className="h-5 w-5 text-indigo-600" />
                Expertise Matrix
              </Label>
              <p className="text-xs text-muted-foreground">
                Dynamic skill leveling based on your activity.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={openEditModal}
              className="font-semibold text-xs h-8 rounded-full"
            >
              Modify Skills
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {user?.skills?.map((skill: any) => (
              <div
                key={skill.id}
                className="group relative p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-800/30 hover:border-indigo-200 dark:hover:border-indigo-900/50 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors">
                    <span className="text-xs font-black text-indigo-600">
                      LVL {Math.floor(skill.level)}
                    </span>
                  </div>
                  {skill.isInterest && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-md text-[9px] font-black uppercase">
                      <Zap className="h-2.5 w-2.5 fill-current" /> Focus
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-bold truncate text-zinc-800 dark:text-zinc-200">
                    {skill.skillName.toUpperCase()}
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-semibold text-zinc-400 uppercase">
                      <span>Progress</span>
                      <span>{Math.floor(skill.experience % 100)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000"
                        style={{ width: `${skill.experience % 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="bg-zinc-50/50 dark:bg-zinc-800/30 p-6 flex justify-end gap-3 rounded-b-xl border-t border-zinc-100 dark:border-zinc-800">
        <Button
          variant="ghost"
          className="font-semibold text-xs uppercase tracking-widest"
        >
          Discard
        </Button>
        <Button
          onClick={handleSave}
          className="bg-zinc-900 dark:bg-white dark:text-zinc-900 hover:scale-105 transition-transform px-8 shadow-lg"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </CardFooter>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 bg-zinc-900 text-white">
            <DialogTitle className="text-xl font-semibold">
              Refine Expertise
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Update your core skills to help AI personalize your workflow.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6">
            <SkillSelector
              selectedSkills={editingSkills}
              popularSkills={POPULAR_SKILLS}
              onChange={(newSkills) => setEditingSkills(newSkills)}
              onBack={() => setIsModalOpen(false)}
              showFooter={false}
            />
          </div>
          <DialogFooter className="p-4 bg-zinc-50 dark:bg-zinc-900 border-t flex gap-2">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveSkills}
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 min-w-[120px]"
            >
              {isLoading ? (
                <Loader2 className="animate-spin h-4 w-4" />
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
