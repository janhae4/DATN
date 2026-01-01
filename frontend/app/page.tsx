import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import {
  ArrowRight,
  CheckCircle2,
  Zap,
  Brain,
  BarChart3,
  Sparkles,
} from "lucide-react";
import HeroImg from "@public/assets/landingPage/heroImg.jpg";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background font-sans text-foreground">
      {/* --- HEADER / NAVBAR --- */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
            <div className="bg-primary text-primary-foreground p-1 rounded-lg">
              <Zap size={20} fill="currentColor" />
            </div>
            <span>Taskora</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link
              href="#features"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              How it works
            </Link>
            <Link
              href="#pricing"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/auth"
              className="text-sm font-medium text-muted-foreground hover:text-foreground hidden sm:block"
            >
              Log in
            </Link>
            <Button asChild>
              <Link href="/auth#signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 lg:px-15">
        {/* --- HERO SECTION --- */}
        <section className="w-full py-30 border-b">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px] items-center">
              <div className="flex flex-col justify-center space-y-4 text-center lg:text-left">
                <div className="space-y-2">
                  <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground bg-secondary hover:bg-secondary/80 mb-2 w-fit mx-auto lg:mx-0">
                    <Sparkles size={12} className="mr-1" /> New: AI Assistant
                    v2.0
                  </div>
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Organize your life with the power of{" "}
                    <span className="text-primary">AI Intelligence</span>
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl mx-auto lg:mx-0">
                    Taskora analyzes your habits and automatically schedules
                    your tasks for peak productivity. Stop planning, start
                    doing.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center lg:justify-start">
                  <Button size="lg" className="px-8" asChild>
                    <Link href="/auth#signup">
                      Start for Free <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="#demo">View Demo</Link>
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground pt-4 flex items-center justify-center lg:justify-start gap-4">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 size={14} className="text-green-500" /> No
                    credit card required
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 size={14} className="text-green-500" /> 14-day
                    free trial
                  </span>
                </div>
              </div>

              {/* Hero Image Placeholder */}
              <div className="mx-auto aspect-video w-full max-w-[600px] overflow-hidden rounded-xl border bg-muted/50 shadow-xl lg:order-last">
                <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                  <Image
                    src={HeroImg}
                    alt="Taskora Dashboard Interface"
                    width={1200}
                    height={800}
                    className="object-cover w-full h-full opacity-80 hover:scale-105 transition-transform duration-500"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- SOCIAL PROOF --- */}
        <section className="w-full py-12 bg-muted/30">
          <div className="container px-4 md:px-6">
            <p className="text-center text-sm font-semibold text-muted-foreground mb-8">
              TRUSTED BY INNOVATIVE TEAMS AT
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 items-center justify-center opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
              {/* Replace these with real logo SVGs or Images */}
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex justify-center items-center h-8">
                  <Image
                    src={`https://placehold.co/200x60/transparent/000000?text=Logo+${i}`}
                    alt={`Partner ${i}`}
                    width={120}
                    height={40}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- FEATURES SECTION --- */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Work Smarter, Not Harder
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Taskora isn't just a todo list. It's a personal assistant that
                  understands how you work best.
                </p>
              </div>
            </div>

            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              {/* Feature 1 */}
              <div className="flex flex-col justify-center space-y-4 p-6 border rounded-xl hover:shadow-lg transition-shadow bg-card">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Brain size={24} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">AI Auto-Scheduling</h3>
                  <p className="text-muted-foreground">
                    Our AI analyzes your task list and automatically blocks time
                    on your calendar based on priority and your energy levels.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col justify-center space-y-4 p-6 border rounded-xl hover:shadow-lg transition-shadow bg-card">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Zap size={24} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Smart Prioritization</h3>
                  <p className="text-muted-foreground">
                    Never wonder what to do next. The Eisenhower Matrix
                    algorithm automatically bubbles up urgent tasks.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col justify-center space-y-4 p-6 border rounded-xl hover:shadow-lg transition-shadow bg-card">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BarChart3 size={24} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Productivity Insights</h3>
                  <p className="text-muted-foreground">
                    Visual analytics show you where your time goes, helping you
                    eliminate bottlenecks and improve focus.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- BIG FEATURE SHOWCASE --- */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary/20">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 lg:grid-cols-2 items-center">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                  Stop drowning in tasks. <br /> Let AI be your lifeguard.
                </h2>
                <p className="text-muted-foreground md:text-xl">
                  Simply dump your thoughts into Taskora. Our Natural Language
                  Processing (NLP) engine will categorize, tag, and schedule
                  them instantly.
                </p>
                <ul className="grid gap-4 py-4">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span>
                      Type "Meeting with John tomorrow at 2pm Scheduled.
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span>Voice dictation support for mobile.</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span>Automatic deadline reminders via Email & Push.</span>
                  </li>
                </ul>
              </div>
              <div className="relative aspect-square lg:aspect-video w-full overflow-hidden rounded-xl border bg-background shadow-2xl">
                <Image
                  src={HeroImg}
                  alt="Feature Demo"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* --- CTA SECTION --- */}
        <section className="w-full py-12 md:py-24 lg:py-32 border-t">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Ready to reclaim your time?
                </h2>
                <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed">
                  Join 10,000+ users who are getting more done in less time with
                  Taskora.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row w-full max-w-md justify-center">
                <Button size="lg" className="w-full" asChild>
                  <Link href="/auth#signup">Get Started for Free</Link>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                No credit card needed. Cancel anytime.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* --- FOOTER --- */}
      <footer className="w-full py-6 bg-background border-t">
        <div className="container px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 font-semibold">
            <Zap size={16} /> Taskora
          </div>
          <p className="text-xs text-muted-foreground">
            {new Date().getFullYear()} Taskora Inc. All rights reserved.
          </p>
          <nav className="flex gap-4 sm:gap-6">
            <Link
              href="#"
              className="text-xs hover:underline underline-offset-4 text-muted-foreground hover:text-foreground"
            >
              Terms of Service
            </Link>
            <Link
              href="#"
              className="text-xs hover:underline underline-offset-4 text-muted-foreground hover:text-foreground"
            >
              Privacy Policy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
