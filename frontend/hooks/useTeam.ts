import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  teamService,
  CreateTeamDto,
  UpdateTeamDto,
  LeaveMemberDto,
  RemoveMemberDto,
  TransferOwnershipDto,
  ChangeRoleMemberDto,
} from "@/services/teamService";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Team } from "@/types";
import apiClient from "@/services/apiClient";

// --- Hooks ---

export const useTeams = () => {
  const { user, isLoading } = useAuth();

  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["teams"],
    queryFn: () => teamService.getTeams(),
    enabled: !!user?.id,
  });

  const isTrulyLoading =
    isLoading ||
    query.isLoading ||
    (query.status === 'pending' && query.fetchStatus === 'idle');

  const acceptInviteMutation = useMutation({
    mutationFn: async (payload: { teamId: string; notificationId: string }) => {
      return apiClient.post(`/teams/${payload.teamId}/member/accepted`, {
        notificationId: payload.notificationId
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["team", variables.teamId] });
    },
  });

  const declineInviteMutation = useMutation({
    mutationFn: async (payload: { teamId: string; notificationId: string }) => {
      return apiClient.delete(`/teams/${payload.teamId}/member/declined`, {
        data: { notificationId: payload.notificationId }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  return {
    ...query,
    acceptInvite: acceptInviteMutation.mutateAsync,
    declineInvite: declineInviteMutation.mutateAsync,
    isAccepting: acceptInviteMutation.isPending,
    isDeclining: declineInviteMutation.isPending,
    isLoading: isTrulyLoading,
  };
};

export const useTeam = (teamId: string | null) => {
  return useQuery({
    queryKey: ["team"],
    queryFn: () => teamService.getTeam(teamId as string),
    enabled: !!teamId,
  });
};

export const useTeamMembers = (teamId: string | null) => {
  return useQuery({
    queryKey: ["teamMembers", teamId],
    queryFn: () => teamService.getTeamMembers(teamId as string),
    enabled: !!teamId,
  });
};

// --- Team Mutations ---

export const useCreateTeam = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: any) => teamService.createTeam(data),

    onSuccess: async (newTeam) => {
      queryClient.setQueryData(["teams"], (oldTeams: Team[] | undefined) => {
        if (!oldTeams) return [newTeam];
        return [...oldTeams, newTeam];
      });
      await queryClient.invalidateQueries({ queryKey: ["teams"] });
      router.push(`/${newTeam.id}`);
    },
  });
};

export const useUpdateTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, data }: { teamId: string; data: UpdateTeamDto }) =>
      teamService.updateTeam(teamId, data),
    onSuccess: (updatedTeam) => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["team", updatedTeam.id] });
    },
  });
};

export const useDeleteTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (teamId: string) => teamService.deleteTeam(teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
};

export const useLeaveTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LeaveMemberDto) => teamService.leaveTeam(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
};

export const useRemoveMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RemoveMemberDto) => teamService.removeMember(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] });
    },
  });
};

export const useTransferOwnership = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TransferOwnershipDto) => teamService.transferOwnership(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["team", variables.teamId] });
      queryClient.invalidateQueries({ queryKey: ["teamMembers", variables.teamId] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
};

export const useChangeMemberRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ChangeRoleMemberDto) => teamService.changeMemberRole(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers", variables.teamId] });
    },
  });
};

export const useAddMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, memberIds }: { teamId: string; memberIds: string[] }) =>
      teamService.addMember({ teamId, memberIds }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers", variables.teamId] });
    },
  });
};