"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useTeams } from "@/hooks/useTeam";
import { Team } from "@/types/social";

interface TeamContextType {
  teams: (Team & { role: string })[] | undefined;
  activeTeam: (Team & { role: string }) | undefined;
  setActiveTeam: (team: Team & { role: string }) => void;
  isLoading: boolean;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const { data: teams, isLoading } = useTeams();
  const [activeTeam, setActiveTeam] = useState<(Team & { role: string }) | undefined>(undefined);

  // Auto-select first team
  useEffect(() => {
    if (teams && teams.length > 0 && !activeTeam) {
      setActiveTeam(teams[0]);
    }
  }, [teams, activeTeam]);

  return (
    <TeamContext.Provider value={{ teams, activeTeam, setActiveTeam, isLoading }}>
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
