"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Import các components đã bóc tách
import { SkillSelector } from "@/components/auth/SkillSelector";
import { JobTitleSelector } from "@/components/auth/JobTitleSelector";
import { onboarding } from "@/services/authService";

const SUGGESTED_TITLES = [
  "Frontend Developer",
  "Backend Developer",
  "Fullstack Developer",
  "UI/UX Designer",
  "Product Manager",
  "QA Engineer",
  "DevOps",
];
const POPULAR_SKILLS = [
  "React",
  "NodeJS",
  "TypeScript",
  "Figma",
  "Python",
  "SQL",
  "Tailwind",
];

const onboardingSchema = z.object({
  jobTitle: z.string().min(2, "Job title is too short").max(50),
  interests: z.array(z.string()).min(1, "Please select at least one skill"),
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

const animationProps = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.1 },
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    watch,
    formState: { errors },
  } = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      jobTitle: "",
      interests: [],
    },
  });

  const selectedInterests = watch("interests");
  const currentJobTitle = watch("jobTitle");

  // Hàm xử lý chuyển bước có validate
  const handleNext = async () => {
    const isStep1Valid = await trigger("jobTitle");
    if (isStep1Valid) setStep(2);
  };

  const onSubmit = async (data: OnboardingValues) => {
    setLoading(true);
    try {
      await onboarding(data);
      toast.success("Profile initialized!");
      router.push("/dashboard");
    } catch (error) {
      toast.error("Submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4 dark:bg-zinc-950">
      <Card className="w-full max-w-[450px] p-8 shadow-2xl border-none ring-1 ring-zinc-200 dark:ring-zinc-800">
        <form onSubmit={handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" {...animationProps}>
                <JobTitleSelector
                  register={register}
                  setValue={setValue}
                  currentTitle={currentJobTitle}
                  suggestions={SUGGESTED_TITLES}
                  error={errors.jobTitle?.message}
                  onNext={handleNext} // Quan trọng để trigger logic chuyển step
                />
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" {...animationProps}>
                <SkillSelector
                  selectedSkills={selectedInterests}
                  popularSkills={POPULAR_SKILLS}
                  onChange={(skills) =>
                    setValue("interests", skills, { shouldValidate: true })
                  }
                  error={errors.interests?.message}
                  loading={loading}
                  onBack={() => setStep(1)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        {/* Stepper dots indicator */}
        <div className="mt-8 flex justify-center gap-1.5">
          {[1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                step === i
                  ? "w-8 bg-zinc-900 dark:bg-zinc-100"
                  : "w-2 bg-zinc-200 dark:bg-zinc-800"
              )}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
