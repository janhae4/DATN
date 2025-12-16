"use client"

import React from 'react';
import { 
  Calendar as CalendarIcon, 
  Link as LinkIcon, 
  Check, 
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { linkGoogleAccount } from '@/services/authService';

export default function GoogleConnectPrompt() {
  return (
    <div className="flex min-h-[80vh] w-full items-center justify-center p-6 bg-white dark:bg-black text-zinc-950 dark:text-zinc-50 font-sans">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center animate-in fade-in zoom-in duration-700">
        
        {/* Left Side: Content Section (No Card Component) */}
        <div className="flex flex-col justify-center space-y-8">
            
            {/* Header / Branding */}
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-black dark:bg-white flex items-center justify-center shadow-xl">
                        <CalendarIcon className="h-6 w-6 text-white dark:text-black" />
                    </div>
                    <div className="w-12 h-[1px] bg-zinc-200 dark:bg-zinc-800"></div>
                    <div className="h-10 w-10 rounded-full border-2 border-zinc-100 dark:border-zinc-800 flex items-center justify-center bg-transparent">
                        <LinkIcon className="h-4 w-4 text-zinc-400" />
                    </div>
                </div>
                
                <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-zinc-950 dark:text-white leading-[1.1]">
                  Sync Your <br/> 
                  <span className="text-zinc-400 dark:text-zinc-600">Calendar.</span>
                </h1>
                
                <p className="text-xl text-zinc-500 dark:text-zinc-400 max-w-md leading-relaxed">
                  Seamlessly connect your Google Calendar. Experience real-time synchronization and smart event management.
                </p>
            </div>
            
            {/* Feature List - Minimalist */}
            <div className="space-y-4 py-4">
              {[
                "Automatic two-way sync",
                "Instant conflict detection",
                "Unified schedule view"
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-4 group">
                  <div className="h-px w-4 bg-zinc-300 dark:bg-zinc-700 group-hover:w-6 transition-all duration-300"></div>
                  <span className="text-zinc-700 dark:text-zinc-300 font-medium tracking-wide">{feature}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-4 max-w-sm">
                <Button 
                  onClick={linkGoogleAccount}
                  className="h-14 rounded-full text-base font-bold bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-all hover:scale-[1.02] shadow-2xl"
                >
                  Connect Google Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                
                <div className="flex items-center gap-2 text-xs text-zinc-400 px-4">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="uppercase tracking-wider font-semibold">Encrypted & Secure</span>
                </div>
            </div>
        </div>

        {/* Right Side: Visual / Image Placeholder */}
        <div className="relative h-full min-h-[500px] w-full flex items-center justify-center lg:justify-end">
            
            {/* Abstract Background Element */}
            <div className="absolute inset-0 bg-zinc-100 dark:bg-zinc-900 rounded-[3rem] -rotate-3 transform scale-90 z-0"></div>

            {/* Main Visual Container */}
            <div className="relative z-10 w-full max-w-md aspect-[3/4] bg-white dark:bg-zinc-950 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
                
                {/* Mock UI Header */}
                <div className="h-16 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between px-6 bg-white dark:bg-zinc-950">
                    <span className="font-bold text-lg tracking-tight">Calendar</span>
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
                        <div className="w-3 h-3 rounded-full bg-zinc-900 dark:bg-zinc-50"></div>
                    </div>
                </div>

                {/* IMAGE PLACEHOLDER AREA */}
                {/* Replace the content of this div with your <img> tag */}
                <div className="flex-1 bg-zinc-50 dark:bg-zinc-900/50 p-6 flex flex-col items-center justify-center relative group cursor-default">
                    
                    {/* Placeholder Icon & Text */}
                    <div className="text-center space-y-4 opacity-30 group-hover:opacity-100 transition-opacity duration-500">
                        
                    </div>

                    {/* Decorative Floating Elements (Mock Events) */}
                    <div className="absolute top-10 right-[-20px] w-40 h-12 bg-black dark:bg-white rounded-l-xl shadow-xl flex items-center px-4 animate-in slide-in-from-right duration-1000 delay-100">
                        <div className="w-2 h-2 rounded-full bg-white dark:bg-black mr-2"></div>
                        <div className="w-20 h-2 bg-white/20 dark:bg-black/20 rounded-full"></div>
                    </div>
                    
                    <div className="absolute bottom-20 left-[-20px] w-48 h-14 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-r-xl shadow-xl flex items-center px-4 animate-in slide-in-from-left duration-1000 delay-300">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 mr-3 flex items-center justify-center">
                            <Check className="w-4 h-4 text-black dark:text-white" />
                        </div>
                        <div className="space-y-1">
                            <div className="w-24 h-2 bg-zinc-900 dark:bg-zinc-100 rounded-full"></div>
                            <div className="w-16 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full"></div>
                        </div>
                    </div>

                </div>
            </div>
        </div>

      </div>
    </div>
  );
}