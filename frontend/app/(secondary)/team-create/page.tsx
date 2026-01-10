"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { teamService } from "@/services/teamService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Users, Loader2, Plus, X, Mail, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function CreateTeamPage() {
  const [name, setName] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [memberInput, setMemberInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const handleAddMember = (e?: React.FormEvent) => {
    e?.preventDefault();
    const email = memberInput.trim();
    if (!email) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Invalid email address");
      return;
    }

    if (members.includes(email)) {
      toast.error("Email already added");
      return;
    }

    setMembers([...members, email]);
    setMemberInput("");
  };

  const handleRemoveMember = (emailToRemove: string) => {
    setMembers(members.filter((email) => email !== emailToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddMember();
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!user) {
      toast.error("User not found. Please login again.");
      return;
    }

    setIsLoading(true);
    try {
      const newTeam = await teamService.createTeam({
        name: name,
        memberIds: [],
      });

      toast.success("Team created successfully!");
      router.replace(`/${newTeam.id}`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to create team");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left Section: Minimalism Form */}
      <div className="flex flex-col justify-center px-8 sm:px-12 lg:px-20 py-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full mx-auto space-y-8"
        >
          <div className="space-y-2 text-left">
            <h1 className="text-3xl font-semibold tracking-tight">Create your team</h1>
            <p className="text-muted-foreground text-sm">
              Start collaborating with your teammates in one shared workspace.
              Efficiency begins with the right setup.
            </p>
          </div>

          <form onSubmit={handleCreateTeam} className="space-y-8">
            <div className="space-y-5">
              {/* Team Name */}
              <div className="space-y-2.5">
                <Label htmlFor="teamName" className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground/80">
                  Workspace Name
                </Label>
                <Input
                  id="teamName"
                  placeholder="e.g. Design Studio, Dev Ops"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  disabled={isLoading}
                  className="h-11 rounded-md border-muted-foreground/20 focus-visible:ring-1"
                />
              </div>

              {/* Members */}
              <div className="space-y-3">
                <Label className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground/80">
                  Invite via email
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="teammate@example.com"
                      className="pl-10 h-11 rounded-md border-muted-foreground/20 focus-visible:ring-1"
                      value={memberInput}
                      onChange={(e) => setMemberInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={isLoading}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleAddMember()}
                    disabled={isLoading || !memberInput.trim()}
                    className="h-11 px-6 font-medium transition-all active:scale-95"
                  >
                    Add
                  </Button>
                </div>

                {/* Chips */}
                <AnimatePresence>
                  {members.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-wrap gap-2 pt-1"
                    >
                      {members.map((email) => (
                        <motion.div
                          key={email}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.9, opacity: 0 }}
                          className="inline-flex items-center gap-2 bg-muted/50 border px-3 py-1.5 rounded-full text-xs"
                        >
                          <span className="text-foreground/80">{email}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(email)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="pt-2 space-y-4">
              <Button
                type="submit"
                className="w-full h-12 text-sm font-semibold transition-all shadow-sm active:scale-[0.98]"
                disabled={isLoading || !name.trim()}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Launching...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Create Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Right Section: Minimalism Placeholder */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950 border-l p-12 relative overflow-hidden">
        {/* Minimalism Placeholder Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="relative z-10 w-full max-w-lg aspect-[4/3] rounded-2xl border bg-background/50 shadow-2xl p-8 flex flex-col gap-6"
        >
          {/* Mockup UI Elements */}
          <div className="h-8 w-1/3 bg-muted rounded-md animate-pulse" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 bg-muted/60 rounded-xl" />
            <div className="h-24 bg-muted/60 rounded-xl border-2 border-primary/20" />
            <div className="h-24 bg-muted/60 rounded-xl" />
          </div>
          <div className="space-y-3">
            <div className="h-4 w-full bg-muted rounded-full" />
            <div className="h-4 w-5/6 bg-muted rounded-full" />
            <div className="h-4 w-4/6 bg-muted rounded-full" />
          </div>
          <div className="mt-auto pt-8 border-t flex items-center justify-between">
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-8 w-8 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center">
                  <Users className="w-3 h-3 text-primary" />
                </div>
              ))}
            </div>
            <div className="h-8 w-24 bg-primary/10 rounded-full flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-primary mr-1" />
              <span className="text-[10px] font-bold text-primary">In Sync</span>
            </div>
          </div>
        </motion.div>

        {/* Appealing Texts */}
        <div className="relative z-10 mt-12 text-center max-w-md space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Simplify your team workflows</h2>
          <p className="text-muted-foreground text-sm leading-relaxed px-4">
            Bring everyone together under one roof. Manage sprints, track progress,
            and ship faster with our intuitive team workspace.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs font-bold text-muted-foreground/40 uppercase tracking-widest pt-4">
            <span>Minimal</span>
            <Separator orientation="vertical" className="h-3" />
            <span>Collaborative</span>
            <Separator orientation="vertical" className="h-3" />
            <span>Fast</span>
          </div>
        </div>

        {/* Decor */}
        <div className="absolute top-[20%] right-[-10%] w-64 h-64 bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] left-[-10%] w-64 h-64 bg-blue-500/5 rounded-full blur-[100px]" />
      </div>
    </div>
  );
}