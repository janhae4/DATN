"use client";
import dynamic from 'next/dynamic'

const AIAssistantUI = dynamic(() => import('@/components/AI-assistant/AI-assistant'), {
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center">
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
