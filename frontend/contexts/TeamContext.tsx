"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useTeams } from "@/hooks/useTeam";
import { Team } from "@/types/social";
import { useParams } from "next/navigation";

interface TeamContextType {
  teams: (Team & { role: string })[] | undefined;
  activeTeam: (Team & { role: string }) | undefined;
  setActiveTeam: (team: Team & { role: string }) => void;
  isLoading: boolean;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const { data: teams, isLoading } = useTeams();
  const params = useParams();
  const teamId = params?.teamId as string;
  const [activeTeam, setActiveTeam] = useState<(Team & { role: string }) | undefined>(undefined);

  // Sync activeTeam with URL teamId or auto-select first team
  useEffect(() => {
    if (teams && teams.length > 0) {
      if (teamId) {
        const teamFromUrl = teams.find(t => t.id === teamId);
        if (teamFromUrl) {
          setActiveTeam(teamFromUrl);
        } else if (!activeTeam) {
          setActiveTeam(teams[0]);
        }
      } else if (!activeTeam) {
        setActiveTeam(teams[0]);
      }
    }
  }, [teams, teamId, activeTeam]);

  const value = useMemo(() => ({
    teams,
    activeTeam,
    setActiveTeam,
    isLoading
  }), [teams, activeTeam, isLoading]);

  return (
    <TeamContext.Provider value={value}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeamContext() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error("useTeamContext must be used within a TeamProvider");
  }
  return context;
}
