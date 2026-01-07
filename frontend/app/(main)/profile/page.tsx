// app/(main)/profile/page.tsx - User Profile Settings Page
"use client";

import { Settings } from "lucide-react";

import { ProfileHeaderAndGeneral } from "@/components/profile/ProfileHeaderAndGeneral";
import { AccountSecurity } from "@/components/profile/AccountSecurity";
import { Suspense } from "react";
import { ProfileHeaderAndGeneralSkeleton } from "@/components/skeletons/ProfileHeaderSkeleton";
import { AccountSecuritySkeleton } from "@/components/skeletons/AccountSecuritySkeleton";

export default function UserProfilePage() {
  return (
    <div className="flex flex-col gap-6 p-6 w-full max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Settings className="h-7 w-7 text-muted-foreground" />
        <h1 className="text-3xl font-bold">Account Settings</h1>
      </div>

      <div className="space-y-8">
        <Suspense fallback={<ProfileHeaderAndGeneralSkeleton />}>
          <ProfileHeaderAndGeneral />
        </Suspense>

        <Suspense fallback={<AccountSecuritySkeleton />}>
          <AccountSecurity />
        </Suspense>
      </div>
    </div>
  );
}
