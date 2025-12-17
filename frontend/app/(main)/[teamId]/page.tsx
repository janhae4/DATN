"use client";

import { EmptyProjectState } from '@/components/features/project/EmptyProjectState';
import { useProjects } from '@/hooks/useProjects';
import { Loader2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

function DefaultTeamPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string;
  
  const { projects, isLoading } = useProjects(teamId);

  useEffect(() => {
    if (!isLoading && projects.length > 0) {
      router.replace(`/${teamId}/${projects[0].id}/dashboard`);
    }
  }, [isLoading, projects, teamId, router]);

  // if (isLoading) {
  //   return (
  //     <div className="flex h-full items-center justify-center">
  //       <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  //     </div>
  //   );
  // }

  if (projects.length > 0) {
    return null; 
  }

  return (
    <div><EmptyProjectState /></div>
  );
}

export default DefaultTeamPage;