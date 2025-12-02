import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teamService } from "@/services/teamService";
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

// export const useSendMessage = () => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: ({ discussionId, senderId, content }: { discussionId: string; senderId: string; content: string }) =>
//       teamService.sendMessage(discussionId, senderId, content),
//     onSuccess: (newMessage, variables) => {
//       // Optimistically update or invalidate
//       queryClient.invalidateQueries({ queryKey: ["messages", variables.discussionId] });
//     },
//   });
// };

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