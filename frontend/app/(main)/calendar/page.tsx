"use client"
import React, { useEffect, useState } from 'react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import CalendarContent from '@/components/calendar/calendarContent';
import GoogleConnectPrompt from '@/components/calendar/GoogleConnectPrompt';
import { isGoogleLinked } from '@/services/authService';

export default function CalendarPage() {
  const [isLinked, setIsLinked] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkGoogleLink = async () => {
      try {
        const linked = await isGoogleLinked();
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
    return <div>Loading...</div>; // Or a loading spinner
  }

  if (!isLinked) {
    return <GoogleConnectPrompt />;
  }

  return <CalendarContent />;
}