"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  MessageSquare,
  UserPlus,
  Mail,
  Briefcase,
  MapPin,
  Calendar,
  CheckCircle2,
  ExternalLink,
  LayoutGrid,
  List,
  Activity,
  Github,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { userService } from "@/services/userService";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamContext } from "@/contexts/TeamContext";
import { User } from "@/types/auth/user.interface";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { HOME_SERVER_ID } from "@/constants/chat";

type TabType = "overview" | "skills" | "activity";

export default function UserPublicProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { activeTeam } = useTeamContext();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  // Custom state for tabs instead of using the Tabs component
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const userData = await userService.getUser(userId);
        setUser(userData as any);
      } catch (error) {
        console.error("Failed to fetch user:", error);
        toast.error("User not found");
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const handleChat = async () => {
    if (!user || isCreatingChat) return;

    try {
      setIsCreatingChat(true);
      const teamId = activeTeam?.id;

      if (!teamId) {
        toast.error("No active team found to start a discussion");
        return;
      }

      router.push(`/${teamId}/chat?serverId=${HOME_SERVER_ID}&dm=${user.id}`);
      toast.success(`Opening chat with ${user.name}`);
    } catch (error) {
      console.error("Failed to start chat:", error);
      toast.error("Failed to start chat session");
    } finally {
      setIsCreatingChat(false);
    }
  };

  const isOwnProfile = currentUser?.id === userId;

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-zinc-900 dark:text-zinc-100">
        <div className="h-16 w-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
          <UserPlus className="h-8 w-8 text-zinc-400" />
        </div>
        <h2 className="text-lg font-medium">User profile not found</h2>
        <Button variant="ghost" className="mt-4" onClick={() => router.back()}>Go back</Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-20 px-4 sm:px-6">
      {/* Hero / Cover */}
      <div className="relative h-64 overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 mt-6 group shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-sky-500/10 to-emerald-500/20 dark:from-indigo-600/30 dark:via-purple-600/20 dark:to-emerald-600/30 transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-50" />
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.1]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
      </div>

      {/* Main Profile Info */}
      <div className="px-4 sm:px-8 -mt-16 relative z-10">
        <div className="flex flex-col md:flex-row items-end md:items-start justify-between gap-6">
          <div className="flex flex-col md:flex-row gap-6 w-full md:w-auto items-center md:items-end">
            {/* Avatar */}
            <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-white dark:border-zinc-950 shadow-sm rounded-2xl bg-white dark:bg-zinc-900">
                {user.avatar ? (
                  <AvatarImage src={user.avatar} className="object-cover" />
                ) : null}
                <AvatarFallback className="text-3xl bg-zinc-50 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-600 font-medium">
                  {user.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {user.isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-zinc-950 p-1 rounded-full shadow-sm ring-1 ring-zinc-100 dark:ring-zinc-800">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-500/10" />
                </div>
              )}
            </div>

            {/* Name & Details */}
            <div className="mb-2 text-center md:text-left space-y-1">
              <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3">
                <h1 className="text-2xl md:text-3xl font-medium text-zinc-900 dark:text-white">
                  {user.name}
                </h1>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
                {user.jobTitle && (
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" />
                    {user.jobTitle}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Joined {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mb-2">
            {isOwnProfile ? (
              <Button
                variant="outline"
                onClick={() => router.push("/profile")}
                className="rounded-lg h-10 px-4 font-medium border-zinc-200 dark:border-zinc-800"
              >
                Edit Profile
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleChat}
                  disabled={isCreatingChat}
                  className="rounded-lg h-10 px-5 font-medium bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Content Grid */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* Left Column: Side Info (4 cols) */}
          <div className="lg:col-span-4 space-y-8 order-2 lg:order-1">
            <section className="animate-in fade-in slide-in-from-left-4 duration-500">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-4 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Contact Info
              </h3>
              <div className="space-y-3">
                <InfoCard
                  icon={<Mail className="h-4 w-4" />}
                  label="Email Address"
                  value={user.email}
                />
                {user.jobTitle && (
                  <InfoCard
                    icon={<Briefcase className="h-4 w-4" />}
                    label="Current Role"
                    value={user.jobTitle}
                  />
                )}
              </div>
            </section>

            {/* Social / Mentions could go here */}
          </div>

          {/* Right Column: Main Content (8 cols) */}
          <div className="lg:col-span-8 space-y-12 order-1 lg:order-2">

            {/* About Section */}
            {user.bio && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  About
                </h3>
                <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                  {user.bio}
                </div>
              </section>
            )}

            {/* Skills Section */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                  Technical Expertise
                </h3>
                <Badge variant="outline" className="rounded-full px-3 py-1 font-medium bg-zinc-50 dark:bg-zinc-900 text-zinc-500">
                  {user.skills?.length || 0} Skills
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.skills && user.skills.length > 0 ? (
                  user.skills.map((skill) => (
                    <div key={skill.id} className="group relative flex flex-col gap-4 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300 hover:shadow-md">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-600 dark:text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white dark:group-hover:bg-zinc-100 dark:group-hover:text-zinc-900 transition-colors">
                          {skill.skillName.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <span className="text-base font-medium text-zinc-900 dark:text-zinc-200">{skill.skillName}</span>
                        </div>
                        <span className="text-xs font-bold text-zinc-400">{Math.floor(skill.experience % 100) || 10}%</span>
                      </div>

                      <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(skill.experience % 100) || 10}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full"
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center bg-zinc-50/50 dark:bg-zinc-900/20 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                    <p className="text-zinc-500 text-sm italic">No specific skills listed yet.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

// -- Helper Components --

function InfoCard({ icon, label, value, isLink }: { icon: React.ReactNode, label: string, value: string, isLink?: boolean }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40">
      <div className="text-zinc-400 dark:text-zinc-500">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-200 truncate flex items-center gap-2">
          {value}
          {isLink && <ExternalLink className="h-3 w-3 text-zinc-400" />}
        </p>
      </div>
    </div>
  );
}

function StatRow({ label, value, highlight }: { label: string, value: string, highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-zinc-600 dark:text-zinc-400">{label}</span>
      <span className={cn(
        "text-sm font-medium",
        highlight ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-900 dark:text-zinc-100"
      )}>
        {value}
      </span>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="max-w-5xl mx-auto pb-20 px-6 space-y-8 animate-pulse">
      <div className="h-48 rounded-xl bg-zinc-100 dark:bg-zinc-900 mt-6" />
      <div className="flex flex-col sm:flex-row items-end gap-6 -mt-16 px-6">
        <div className="h-32 w-32 rounded-2xl bg-zinc-200 dark:bg-zinc-800 border-4 border-white dark:border-zinc-950" />
        <div className="mb-2 space-y-2 flex-1">
          <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
          <div className="h-4 w-64 bg-zinc-100 dark:bg-zinc-800 rounded-md" />
        </div>
      </div>
      <div className="px-6 grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-900 rounded-md" />
          <div className="h-4 w-3/4 bg-zinc-100 dark:bg-zinc-900 rounded-md" />
        </div>
        <div className="h-40 bg-zinc-100 dark:bg-zinc-900 rounded-xl" />
      </div>
    </div>
  );
}