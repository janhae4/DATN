"use client";
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
<<<<<<< HEAD
} from "lucide-react";
import HeroImg from "@public/assets/landingPage/heroImg.jpg";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background font-sans text-foreground">
=======
  Layout,
  Users,
} from "lucide-react";
import HeroImg from "@public/assets/landingPage/heroImg.jpg";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-background font-sans text-foreground">
      {/* --- HEADER / NAVBAR --- */}
>>>>>>> origin/blank_branch
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
<<<<<<< HEAD
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
=======
              href="#workflow"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Workflow
            </Link>
            <Link
              href="#community"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Community
>>>>>>> origin/blank_branch
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
<<<<<<< HEAD
        <section className="w-full py-30 border-b">
=======
        <section className="w-full flex flex-col items-center justify-center py-30 border-b">
>>>>>>> origin/blank_branch
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px] items-center">
              <div className="flex flex-col justify-center space-y-4 text-center lg:text-left">
                <div className="space-y-2">
<<<<<<< HEAD
                  <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground bg-secondary hover:bg-secondary/80 mb-2 w-fit mx-auto lg:mx-0">
                    <Sparkles size={12} className="mr-1" /> New: AI Assistant
                    v2.0
                  </div>
=======
>>>>>>> origin/blank_branch
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
<<<<<<< HEAD
                      Start for Free <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="#demo">View Demo</Link>
=======
                      Start Now <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="#workflow">Explore Workflow</Link>
>>>>>>> origin/blank_branch
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground pt-4 flex items-center justify-center lg:justify-start gap-4">
                  <span className="flex items-center gap-1">
<<<<<<< HEAD
                    <CheckCircle2 size={14} className="text-green-500" /> No
                    credit card required
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 size={14} className="text-green-500" /> 14-day
                    free trial
=======
                    <CheckCircle2 size={14} className="text-green-500" />{" "}
                    Intelligent Scheduling
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 size={14} className="text-green-500" />{" "}
                    Seamless Collaboration
>>>>>>> origin/blank_branch
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

<<<<<<< HEAD
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
=======
        {/* --- FEATURES SECTION --- */}
        <section id="features" className="w-full flex flex-col items-center justify-center py-24 lg:py-32 relative">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm text-primary font-medium mb-2">
                  Key Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
                  Work Smarter, Not Harder
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Taskora isn't just a todo list. It's a personal assistant that understands how you work best.
                </p>
              </div>
            </div>

            <div className="mx-auto  grid max-w-6xl items-start gap-8 lg:grid-cols-3">
              {[
                {
                  icon: Brain,
                  title: "AI Auto-Scheduling",
                  desc: "Our AI analyzes your task list and automatically blocks time on your board.",
                  color: "text-purple-500",
                  bg: "bg-purple-500/10"
                },
                {
                  icon: Zap,
                  title: "Smart Prioritization",
                  desc: "Never wonder what to do next. The system automatically bubbles up urgent tasks.",
                  color: "text-amber-500",
                  bg: "bg-amber-500/10"
                },
                {
                  icon: BarChart3,
                  title: "Productivity Insights",
                  desc: "Visual analytics show you where your time goes, helping you eliminate bottlenecks and improve focus.",
                  color: "text-blue-500",
                  bg: "bg-blue-500/10"
                }
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -5 }}
                  className="flex h-full flex-col space-y-4 p-8 border rounded-3xl bg-background/50 backdrop-blur-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 relative overflow-hidden group"
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 ${feature.bg} rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500`} />
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${feature.bg} ${feature.color}`}>
                    <feature.icon size={24} />
                  </div>
                  <div className="space-y-2 relative">
                    <h3 className="text-xl font-bold">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* --- WORKFLOW / SHOWCASE --- */}
        <section id="workflow" className="w-full flex flex-col items-center justify-center py-24 lg:py-32 bg-secondary/30 relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

          <div className="container px-4 md:px-6 relative z-10">
            <div className="grid gap-16 lg:grid-cols-2 items-center">
              <div className="space-y-8">
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold tracking-tighter md:text-5xl">
                    Stop drowning in tasks. <br />
                    <span className="text-primary">Let AI be your lifeguard.</span>
                  </h2>
                  <p className="text-muted-foreground md:text-xl leading-relaxed">
                    Simply dump your thoughts into Taskora. Our Natural Language
                    Processing (NLP) engine will categorize, tag, and schedule
                    them instantly.
                  </p>
                </div>

                <ul className="space-y-5">
                  {[
                    "Type 'Meeting with John tomorrow at 2pm'",
                    "Manual scheduling",
                    "Automatic deadline reminders via notifications"
                  ].map((item, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-4 p-4 rounded-xl bg-background border shadow-sm"
                    >
                      <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={16} />
                      </div>
                      <span className="font-medium text-sm md:text-base">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              <div className="relative flex flex-col items-center justify-center aspect-square lg:aspect-[4/3] w-full max-w-[600px] mx-auto">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary to-purple-500 rounded-3xl blur-2xl opacity-20 transform rotate-6" />
                <div className="relative h-full w-full overflow-hidden rounded-2xl border bg-zinc-950 shadow-2xl">
                  {/* Mock Browser/App Window */}
                  <div className="absolute top-0 left-0 w-full h-10 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 gap-2 z-20">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/20 md:bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/20 md:bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500/20 md:bg-green-500" />
                    </div>
                  </div>
                  <Image
                    src={HeroImg}
                    alt="Feature Demo"
                    fill
                    className="object-cover mt-10"
                  />

                  {/* Floating AI Notification */}
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="absolute bottom-8 left-8 right-8 bg-zinc-900/90 backdrop-blur-md text-white p-4 rounded-xl border border-zinc-800 shadow-2xl"
                  >
                    <div className="flex gap-3">
                      <div className="p-2 bg-primary rounded-lg h-fit">
                        <Sparkles size={16} />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-400 mb-1">AI Suggestion</p>
                        <p className="text-sm font-medium">"I noticed you have 3 meetings tomorrow. Shall I block focus time in the morning?"</p>
                        <div className="flex gap-2 mt-3">
                          <button className="text-xs bg-white text-black px-3 py-1.5 rounded-md font-medium hover:bg-zinc-200">Yes, block it</button>
                          <button className="text-xs bg-zinc-800 text-white px-3 py-1.5 rounded-md hover:bg-zinc-700">Dismiss</button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- TEAM / COMMUNITY --- */}
        <section id="community" className="w-full flex flex-col items-center justify-center py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-4">
                Built for Teams & Individuals
              </h2>
              <p className="text-muted-foreground md:text-xl/relaxed">
                Whether you're a solo freelancer or leading a large project, Taskora scales to meet your coordination needs.
              </p>
            </div>

            <div className="mx-auto grid max-w-5xl items-center gap-6 lg:grid-cols-2 lg:gap-12">
              {[
                {
                  icon: Users,
                  title: "Collaborative Workspaces",
                  desc: "Invite team members, assign tasks, and track progress in real-time without the chaos of email threads."
                },
                {
                  icon: Layout,
                  title: "Customizable Views",
                  desc: "Switch between Kanban, List, Gantt, and Calendar views to visualize your project exactly how you want."
                }
              ].map((item, idx) => (
                <div key={idx} className="group flex flex-row items-start space-x-6 p-8 border rounded-3xl hover:bg-secondary/20 transition-colors">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                    <item.icon size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
>>>>>>> origin/blank_branch
                </div>
              ))}
            </div>
          </div>
        </section>

<<<<<<< HEAD
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
=======
        {/* --- CTA SECTION --- */}
        <section className="w-full flex flex-col items-center justify-center py-12 md:py-24 lg:py-32 border-t">
>>>>>>> origin/blank_branch
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Ready to reclaim your time?
                </h2>
                <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed">
<<<<<<< HEAD
                  Join 10,000+ users who are getting more done in less time with
                  Taskora.
=======
                  Join thousands of users who are organizing their life and work with Taskora.
>>>>>>> origin/blank_branch
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row w-full max-w-md justify-center">
                <Button size="lg" className="w-full" asChild>
<<<<<<< HEAD
                  <Link href="/auth#signup">Get Started for Free</Link>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                No credit card needed. Cancel anytime.
=======
                  <Link href="/auth#signup">Get Started</Link>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Join our open community today.
>>>>>>> origin/blank_branch
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* --- FOOTER --- */}
<<<<<<< HEAD
      <footer className="w-full py-6 bg-background border-t">
=======
      <footer className="w-full flex flex-col items-center justify-center py-6 bg-background border-t">
>>>>>>> origin/blank_branch
        <div className="container px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 font-semibold">
            <Zap size={16} /> Taskora
          </div>
          <p className="text-xs text-muted-foreground">
<<<<<<< HEAD
            {new Date().getFullYear()} Taskora Inc. All rights reserved.
=======
            {new Date().getFullYear()} Taskora. All rights reserved.
>>>>>>> origin/blank_branch
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
<<<<<<< HEAD
=======
            <Link
              href="mailto:support@taskora.io"
              className="text-xs hover:underline underline-offset-4 text-muted-foreground hover:text-foreground"
            >
              Contact Support
            </Link>
>>>>>>> origin/blank_branch
          </nav>
        </div>
      </footer>
    </div>
  );
}