"use client";
import { Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import React from 'react'


const AIAssistantUI = dynamic(() => import('@/components/AI-assistant/AI-assistant'), {
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center">
        {/* <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /> */}
    </div>
  ),
  ssr: false 
})

export default function page() {
  return (
    <div>     
        <AIAssistantUI/>
    </div>
  )
}
