import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  teamService, 
  CreateTeamDto, 
  UpdateTeamDto, 
  LeaveMemberDto,
  RemoveMemberDto,
  TransferOwnershipDto,
  ChangeRoleMemberDto,
  AddMemberDto
} from "@/services/teamService";
import { useUserProfile } from "./useAuth";

// --- Hooks ---

export const useTeams = () => {
  const { data: user } = useUserProfile();
  
  return useQuery({
    queryKey: ["teams", user?.id],
    queryFn: () => teamService.getTeams(), 
    enabled: !!user?.id,
  });
};

export const useTeam = (teamId: string | null) => {
  return useQuery({
    queryKey: ["team", teamId],
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
  const { data: user } = useUserProfile();

  return useMutation({
    mutationFn: (data: CreateTeamDto) => teamService.createTeam(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams", user?.id] });
    },
  });
};

export const useUpdateTeam = () => {
  const queryClient = useQueryClient();
  const { data: user } = useUserProfile();

  return useMutation({
    mutationFn: ({ teamId, data }: { teamId: string; data: UpdateTeamDto }) =>
      teamService.updateTeam(teamId, data),
    onSuccess: (updatedTeam) => {
      queryClient.invalidateQueries({ queryKey: ["teams", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["team", updatedTeam.id] });
    },
  });
};

export const useDeleteTeam = () => {
  const queryClient = useQueryClient();
  const { data: user } = useUserProfile();

  return useMutation({
    mutationFn: (teamId: string) => teamService.deleteTeam(teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams", user?.id] });
    },
  });
};

export const useLeaveTeam = () => {
  const queryClient = useQueryClient();
  const { data: user } = useUserProfile();

  return useMutation({
    mutationFn: (payload: LeaveMemberDto) => teamService.leaveTeam(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams", user?.id] });
    },
  });
};

export const useRemoveMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RemoveMemberDto) => teamService.removeMember(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers", variables.teamId] });
    },
  });
};

export const useTransferOwnership = () => {
  const queryClient = useQueryClient();
  const { data: user } = useUserProfile();
  
  return useMutation({
    mutationFn: (payload: TransferOwnershipDto) => teamService.transferOwnership(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["team", variables.teamId] });
      queryClient.invalidateQueries({ queryKey: ["teamMembers", variables.teamId] });
      queryClient.invalidateQueries({ queryKey: ["teams", user?.id] });
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

export const useDiscussions = (teamId: string | null) => {
  return useQuery({
    queryKey: ["discussions", teamId],
    queryFn: () => teamService.getDiscussions(teamId as string),
    enabled: !!teamId,
  });
};

export const useDiscussion = (discussionId: string | null) => {
  return useQuery({
    queryKey: ["discussion", discussionId],
    queryFn: () => teamService.getDiscussion(discussionId as string),
    enabled: !!discussionId,
  });
};

export const useMessages = (discussionId: string | null) => {
  return useQuery({
    queryKey: ["messages", discussionId],
    queryFn: () => teamService.getMessages(discussionId as string),
    enabled: !!discussionId,
    refetchInterval: 5000,
  });
};

// --- Mutations ---

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ discussionId, content }: { discussionId: string; content: string }) =>
      teamService.sendMessage(discussionId, content),
    onSuccess: (_, variables) => {
      // Optimistically update or invalidate
      queryClient.invalidateQueries({ queryKey: ["messages", variables.discussionId] });
    },
  });
};

export const useCreateDiscussion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, name, ownerId, memberIds }: { teamId: string; name: string; ownerId: string; memberIds?: string[] }) =>
      // Lưu ý: createDiscussion trong service vẫn yêu cầu các tham số này
      teamService.createDiscussion(teamId, name, memberIds), 
    onSuccess: (newDiscussion, variables) => {
      // Sửa: Dùng biến từ closure hoặc response nếu cần, ở đây variables.teamId là ok
      // Lưu ý: createDiscussion trong service của bạn hiện tại không nhận ownerId làm tham số thứ 3,
      // mà là (teamId, name, memberIds). Hãy kiểm tra lại teamService nếu cần.
      // Dưới đây tôi đã sửa lại mutationFn để khớp với teamService bạn gửi trước đó.
      queryClient.invalidateQueries({ queryKey: ["discussions", variables.teamId] });
    },
  });
};

export const useGetOrCreateDirectMessage = () => {
  return useMutation({
    mutationFn: ({ currentUserId, targetUserId }: { currentUserId: string; targetUserId: string }) =>
      teamService.getOrCreateDirectMessage(targetUserId), // Sửa: Service chỉ nhận targetUserId
  });
};

export const useAddMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, requesterId, memberIds }: { teamId: string; requesterId: string; memberIds: string[] }) =>
      teamService.addMember({ teamId, requesterId, memberIds }), // Sửa: Truyền object DTO chuẩn
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers", variables.teamId] });
    },
  });
};