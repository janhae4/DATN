"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Video, Link, ArrowRight, Keyboard, Clock, Settings, Shield, Lock, Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import { videoChatService } from "@/services/videoChatService";
import { useAuth } from "@/contexts/AuthContext";

export default function CreateVideoCallPage() {
  const { user } = useAuth();
  const [roomId, setRoomId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId as string;
  const [meetingPassword, setMeetingPassword] = useState("");
  const [isLobbyEnabled, setIsLobbyEnabled] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const handleCreateRoom = async () => {
    if (!user) {
      toast.error("Authentication required", {
        description: "Please login to create a meeting.",
      });
      return;
    }

    setIsCreating(true);

    try {
      const response = await videoChatService.createOrJoinCall({
        teamId,
        password: meetingPassword || undefined,
        isLobbyEnabled: isLobbyEnabled,
      });

      if (response && response.roomId) {
        toast.success("Meeting Created", {
          description: "Redirecting you to the room...",
        });
        router.push(`/meeting/${response.roomId}`);
      }
    } catch (error: any) {
      console.error("Create room error:", error);
      toast.error("Failed to create room", {
        description: error.response?.data?.message || "Please try again.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomId.trim()) {
      toast.warning("Input required", {
        description: "Please enter a Room ID or Link.",
      });
      return;
    }

    let finalRoomId = roomId.trim();
    if (finalRoomId.startsWith("http")) {
      try {
        const url = new URL(finalRoomId);
        const extracted = url.pathname.split("/").pop();
        if (extracted) finalRoomId = extracted;
      } catch (e) {
        /* ignore error */
      }
    }

    setIsCreating(true);
    try {
      const history = await videoChatService.getCallInfo(finalRoomId);
      if (history) {
        toast.info("Joining Room...", {
          description: `Target: ${finalRoomId}`,
        });
        router.push(`/meeting/${finalRoomId}`);
      } else {
        toast.error("Invalid Room", {
          description: "The meeting ID is invalid or has ended.",
        });
      }
    } catch (error: any) {
      console.error("Join room error:", error);
      toast.error("Connection Error", {
        description:
          error.response?.data?.message || "Could not verify room details.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 sm:p-8 py-10 sm:py-20 relative bg-background">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10 animate-in fade-in zoom-in duration-700">

        {/* Left Col: Hero Text & Create */}
        <div className="space-y-10 flex flex-col justify-center">
          <div className="space-y-6 text-center lg:text-left flex flex-col items-center lg:items-start">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase mb-2 border border-primary/20">
              <Sparkles className="h-3.5 w-3.5" /> Next-gen meetings
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-zinc-950 dark:text-white leading-[1.1]">
              Collaboration,<br />
              <span className="text-zinc-400 dark:text-zinc-600">
                reimagined.
              </span>
            </h1>
            <p className="text-xl text-zinc-500 dark:text-zinc-400 max-w-md mx-auto lg:mx-0 leading-relaxed">
              Start a high-quality video meeting or join an existing one in seconds. Secure, fast, and feature-rich.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start w-full">
            <Button
              onClick={handleCreateRoom}
              disabled={isCreating}
              size="lg"
              className="h-14 px-8 rounded-full text-base font-bold bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-all hover:scale-[1.02] shadow-2xl w-full sm:w-auto shrink-0"
            >
              {isCreating ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Video className="mr-2.5 h-5 w-5" />
              )}
              {isCreating ? "Starting..." : "Start Meeting"}
            </Button>

            <div className="flex items-center gap-2 w-full max-w-sm relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Keyboard className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
              <Input
                type="text"
                placeholder="Enter a code or link"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                disabled={isCreating}
                className="h-14 pl-12 pr-24 rounded-2xl bg-muted/40 border-muted-foreground/10 focus-visible:ring-primary/20 focus-visible:border-primary/50 text-base font-medium transition-all"
                onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
              />
              <Button
                onClick={handleJoinRoom}
                disabled={isCreating || !roomId.trim()}
                variant="ghost"
                className={`absolute right-1.5 h-11 px-5 rounded-xl text-sm font-bold transition-all ${roomId.trim() ? 'bg-muted-foreground/10 text-foreground hover:bg-muted-foreground/20' : 'text-muted-foreground/50 hover:bg-transparent'}`}
              >
                Join
              </Button>
            </div>
          </div>

          {/* Settings & History Row */}
          <div className="pt-6 border-t border-border/50 flex flex-wrap items-center justify-center lg:justify-start gap-8">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="flex items-center gap-3 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors group"
            >
              <div className="h-9 w-9 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-muted transition-colors border border-transparent group-hover:border-border/50">
                <Settings className={`h-4.5 w-4.5 transition-transform duration-500 ease-out ${showOptions ? 'rotate-90 text-primary' : ''}`} />
              </div>
              Meeting Options
            </button>

            <button
              onClick={() => router.push(`/${teamId}/meeting/history`)}
              className="flex items-center gap-3 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors group"
            >
              <div className="h-9 w-9 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-muted transition-colors border border-transparent group-hover:border-border/50">
                <Clock className="h-4.5 w-4.5 transition-transform duration-300 group-hover:-rotate-12" />
              </div>
              View History
            </button>
          </div>

          {/* Expandable Options */}
          <div className={`overflow-hidden transition-all duration-500 ease-out origin-top ${showOptions ? 'max-h-96 opacity-100 scale-100' : 'max-h-0 opacity-0 scale-95'}`}>
            <div className="bg-card/50 backdrop-blur-md border border-border/50 rounded-4xl p-6 space-y-6 mt-2">
              <div className="space-y-3">
                <Label htmlFor="password" title="Set a password for this meeting" className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Meeting Password (Optional)
                </Label>
                <div className="relative group/input">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Leave blank for no password"
                    value={meetingPassword}
                    onChange={(e) => setMeetingPassword(e.target.value)}
                    className="pl-12 h-12 rounded-2xl bg-background border-border/50 focus-visible:ring-primary/20 shadow-sm font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-background border border-border/50 shadow-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4.5 w-4.5 text-emerald-500" />
                    <Label className="text-sm font-bold">Lobby Mode</Label>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">Host must approve participants before they join.</p>
                </div>
                <Switch
                  checked={isLobbyEnabled}
                  onCheckedChange={setIsLobbyEnabled}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Graphic/Illustration placeholder */}
        <div className="relative h-full min-h-[500px] w-full hidden lg:flex items-center justify-center lg:justify-end">

          {/* Abstract Background Element */}
          <div className="absolute inset-0 bg-zinc-100 dark:bg-zinc-900 rounded-[3rem] -rotate-3 transform scale-90 z-0 transition-transform duration-700 hover:rotate-0"></div>

          <div className="relative z-10 w-full max-w-md aspect-4/3 bg-white dark:bg-zinc-950 rounded-4xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col p-6 transition-transform duration-700 hover:scale-[1.02] group">
            <div className="flex items-center justify-between mb-8">
              <div className="flex gap-2.5">
                <div className="w-3.5 h-3.5 rounded-full bg-red-400/80 shadow-inner" />
                <div className="w-3.5 h-3.5 rounded-full bg-yellow-400/80 shadow-inner" />
                <div className="w-3.5 h-3.5 rounded-full bg-green-400/80 shadow-inner" />
              </div>
              <div className="bg-primary/10 text-primary text-[10px] font-black px-3.5 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Live
              </div>
            </div>

            {/* Mock Video Grid */}
            <div className="grid grid-cols-2 gap-4 flex-1">
              <div className="bg-muted/50 rounded-2xl overflow-hidden relative group/vid1 border border-border/50">
                {/* Mock user placeholder */}
                <div className="absolute inset-0 bg-linear-to-b from-transparent to-black/50 opacity-0 group-hover/vid1:opacity-100 transition-opacity duration-300 z-10" />
                <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-white flex items-center gap-1.5 z-20 shadow-sm">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Alex
                </div>
              </div>
              <div className="bg-muted/50 rounded-2xl overflow-hidden relative group/vid2 border border-border/50">
                <div className="absolute flex items-center justify-center inset-0">
                  <div className="w-14 h-14 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-500 font-black text-xl shadow-inner">S</div>
                </div>
                <div className="absolute inset-0 bg-linear-to-b from-transparent to-black/50 opacity-0 group-hover/vid2:opacity-100 transition-opacity duration-300 z-10" />
                <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-white flex items-center gap-1.5 z-20 shadow-sm animate-pulse">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full" /> Speaking...
                </div>
              </div>
              <div className="bg-muted/30 rounded-2xl overflow-hidden relative border-2 border-dashed border-muted-foreground/15 col-span-2 group/vid3 flex items-center justify-center">
                <span className="text-sm font-bold text-muted-foreground/60 transition-colors group-hover/vid3:text-primary/60">Waiting for others to join...</span>
              </div>
            </div>

            {/* Mock Controls */}
            <div className="mt-8 flex items-center justify-center gap-5">
              <div className="w-11 h-11 rounded-full bg-muted border border-border/50 shadow-sm flex items-center justify-center cursor-not-allowed">
                <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/50 line-through opacity-50" />
              </div>
              <div className="w-11 h-11 rounded-full bg-muted border border-border/50 shadow-sm flex items-center justify-center cursor-not-allowed">
                <Video className="w-4 h-4 text-muted-foreground/50" />
              </div>
              <div className="w-16 h-11 rounded-2xl bg-red-500/90 shadow-lg shadow-red-500/20 flex items-center justify-center">
                <div className="w-6 h-1.5 rounded-full bg-white/80" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
