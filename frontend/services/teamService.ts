import apiClient from "./apiClient";
import { Member, Team, TeamMember } from "@/types/social";
import { Discussion, Message } from "@/types/communication";
import { User } from "@/types/auth";
import { MemberRole } from "@/types/common/enums";

// --- Interfaces matching Backend DTOs ---

export interface CreateTeamDto {
  name: string;
  avatar?: string;
  memberIds?: string[];
}

export interface UpdateTeamDto extends Partial<CreateTeamDto> {}

export interface AddMemberDto {
  requesterId: string; // ID của người đang thực hiện hành động (Admin/Owner)
  teamId: string;
  memberIds: string[]; // Backend nhận mảng ID, không phải email
}

export interface RemoveMemberDto {
  requesterId: string;
  teamId: string;
  memberIds: string[];
}

export interface LeaveMemberDto {
  requesterId: string;
  teamId: string;
}

export interface TransferOwnershipDto {
  teamId: string;
  newOwnerId: string;
  requesterId: string;
}

export interface ChangeRoleMemberDto {
  requesterId: string;
  teamId: string;
  targetId: string; 
  newRole: MemberRole;
}

// --- Service Implementation ---

export const teamService = {

  
  // Get teams for the current user
  getTeams: async (): Promise<(Team & { role: string })[]> => {
    const response = await apiClient.get<Team[]>('/teams/me');
    return response.data as (Team & { role: string })[];
  },

  // Get a single team by ID
  getTeam: async (teamId: string): Promise<Team | undefined> => {
    const response = await apiClient.get<Team>(`/teams/${teamId}`);
    return response.data;
  },

  // Create a new team
  createTeam: async (data: CreateTeamDto): Promise<Team> => {
    const response = await apiClient.post<Team>('/teams', data);
    return response.data;
  },

  // Update team
  updateTeam: async (teamId: string, data: UpdateTeamDto): Promise<Team> => {
    const response = await apiClient.patch<Team>(`/teams/${teamId}`, data);
    return response.data;
  },

  // Delete a team
  deleteTeam: async (teamId: string): Promise<void> => {
    await apiClient.delete(`/teams/${teamId}`);
  },

  // Get members of a specific team
  getTeamMembers: async (teamId: string): Promise<Member[]> => {
    const response = await apiClient.get<Member[]>(`/teams/${teamId}/members`);
    return response.data;
  },

  // Add member to team
  addMember: async (payload: AddMemberDto): Promise<void> => {
    await apiClient.post(`/teams/${payload.teamId}/member`, payload);
  },

  // Remove member from team
  removeMember: async (payload: RemoveMemberDto): Promise<void> => {
    // Dùng HTTP DELETE với body (axios hỗ trợ qua config 'data')
    await apiClient.delete(`/teams/${payload.teamId}/member`, { data: payload });
  },

  // Leave team
  leaveTeam: async (payload: LeaveMemberDto): Promise<void> => {
    await apiClient.post(`/teams/${payload.teamId}/member/leave`, payload);
  },

  // Transfer ownership
  transferOwnership: async (payload: TransferOwnershipDto): Promise<void> => {
    await apiClient.post(`/teams/${payload.teamId}/member/transfer-ownership`, payload);
  },

  // Change member role
  changeMemberRole: async (payload: ChangeRoleMemberDto): Promise<void> => {
    await apiClient.patch(`/teams/${payload.teamId}/member/${payload.targetId}/role`, payload);
  },

  // --- DISCUSSION & MESSAGING ---

  getDiscussions: async (teamId: string): Promise<Discussion[]> => {
    const response = await apiClient.get<Discussion[]>(`/discussions/teams/${teamId}`);
    return response.data;
  },

  getDiscussion: async (discussionId: string): Promise<Discussion | undefined> => {
    const response = await apiClient.get<Discussion>(`/discussions/${discussionId}`);
    return response.data;
  },

  getMessages: async (discussionId: string): Promise<Message[]> => {
    const response = await apiClient.get<Message[]>(`/discussions/${discussionId}/messages`);
    return response.data;
  },

  sendMessage: async (discussionId: string, content: string): Promise<Message> => {
    const response = await apiClient.post<Message>(`/discussions/${discussionId}/messages`, { content });
    return response.data;
  },

  createDiscussion: async (teamId: string, name: string, memberIds?: string[]): Promise<Discussion> => {
    const response = await apiClient.post<Discussion>('/discussions', {
      teamId,
      name,
      participants: memberIds,
      isGroup: true
    });
    return response.data;
  },

  getOrCreateDirectMessage: async (targetUserId: string): Promise<Discussion> => {
    const response = await apiClient.post<Discussion>('/discussions/direct', {
      targetUserId
    });
    return response.data;
  },
};