"use client"
import React, { useEffect, useState } from 'react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import CalendarContent from '@/components/calendar/calendarContent';
import GoogleConnectPrompt from '@/components/calendar/GoogleConnectPrompt';
import { isGoogleLinked } from '@/services/authService';
import { Loader2 } from 'lucide-react';
import CalendarTaskList from '@/components/calendar/CalendarTaskList';

export default function CalendarPage() {
  const [isLinked, setIsLinked] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [showTaskList, setShowTaskList] = useState(false);

  useEffect(() => {
    const checkGoogleLink = async () => {
      try {
        const linked = await isGoogleLinked();
        console.log("google linked chua: ", linked)
        setIsLinked(linked);
      } catch (error) {
        console.error('Error checking Google link status:', error);
        setIsLinked(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkGoogleLink();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center flex-col gap-4">
        <Loader2 className="h-10 w-10 animate-spin " />
        <p className="text-sm font-medium text-slate-500 animate-pulse">Verifying connection...</p>
      </div>
    );
  }

  if (!isLinked) {
    return <GoogleConnectPrompt />;
  }

  return (
    <div className='flex gap-2 h-[calc(100vh-100px)]'>
      <div
        className={`transition-all duration-300 ease-in-out ${showTaskList ? 'w-[350px] opacity-100 mr-2' : 'w-0 opacity-0 overflow-hidden'
          }`}
      >
        <CalendarTaskList />
      </div>
      <div className='flex-1 min-w-0'>
        <CalendarContent
          onToggleTaskList={() => setShowTaskList(!showTaskList)}
          isTaskListOpen={showTaskList}
        />
      </div>
    </div>
  );
}