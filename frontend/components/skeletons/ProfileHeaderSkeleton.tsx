import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export function ProfileHeaderAndGeneralSkeleton() {
  return (
    <Card>
      {/* Header */}
      <CardHeader>
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" /> {/* Title */}
          <Skeleton className="h-4 w-72" /> {/* Description */}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Avatar & Info Section */}
        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-zinc-50/50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
          {/* Avatar Circle */}
          <div className="relative">
            <Skeleton className="h-24 w-24 rounded-full border-4 border-white dark:border-zinc-800" />
            <Skeleton className="absolute bottom-0 right-0 h-8 w-8 rounded-full" />{" "}
            {/* Upload Icon placeholder */}
          </div>

          {/* User Info & Badges */}
          <div className="flex-1 space-y-3 w-full text-center sm:text-left">
            <div className="space-y-2 flex flex-col items-center sm:items-start">
              <Skeleton className="h-5 w-40" /> {/* Name */}
              <Skeleton className="h-4 w-56" /> {/* Email */}
            </div>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              <Skeleton className="h-8 w-32 rounded-full" />{" "}
              {/* Google Link Button */}
              <Skeleton className="h-8 w-24 rounded-full" /> {/* Role Badge */}
            </div>
          </div>
        </div>

        <Separator />

        {/* Form Inputs Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Loop 4 times for Name, Email, Phone, Job Title */}
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" /> {/* Label */}
              <Skeleton className="h-10 w-full rounded-md" /> {/* Input */}
            </div>
          ))}
        </div>

        <Separator className="my-6" />

        {/* Expertise/Skills Section */}
        <div className="space-y-6">
          {/* Skills Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-8 w-28 rounded-full" /> {/* Modify Button */}
          </div>

          {/* Skills Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Render 6 fake skill cards */}
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-800/30"
              >
                <div className="flex items-center justify-between mb-3">
                  <Skeleton className="h-8 w-14 rounded-lg" />{" "}
                  {/* Level Badge */}
                  {i % 2 === 0 && (
                    <Skeleton className="h-5 w-16 rounded-md" />
                  )}{" "}
                  {/* Focus Badge (Randomly shown) */}
                </div>

                <div className="space-y-3">
                  <Skeleton className="h-5 w-24" /> {/* Skill Name */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-12" />
                      <Skeleton className="h-3 w-8" />
                    </div>
                    <Skeleton className="h-1.5 w-full rounded-full" />{" "}
                    {/* Progress Bar */}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      {/* Footer Buttons */}
      <CardFooter className="bg-zinc-50/50 dark:bg-zinc-800/30 p-6 flex justify-end gap-3 rounded-b-xl border-t border-zinc-100 dark:border-zinc-800">
        <Skeleton className="h-9 w-20" /> {/* Discard */}
        <Skeleton className="h-9 w-32" /> {/* Save Changes */}
      </CardFooter>
    </Card>
  );
}
