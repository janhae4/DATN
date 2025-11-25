import { db } from "@/public/mock-data/mock-data";
import { Team, TeamMember } from "@/types/social";
import { Discussion, Message } from "@/types/communication";
import { User } from "@/types/auth";
import { MemberRole } from "@/types/common/enums";

// Helper to simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const teamService = {
  // Get teams for a specific user
  getTeams: async (userId: string): Promise<(Team & { role: string })[]> => {
    await delay(500);
    // Find team memberships for the user
    const memberships = db.team_members.filter((m) => m.userId === userId && m.isActive);
    const teamIds = memberships.map((m) => m.teamId);
    
    // Return the teams with role
    return db.teams
      .filter((t) => teamIds.includes(t.id))
      .map(team => {
        const membership = memberships.find(m => m.teamId === team.id);
        return {
          ...team,
          role: membership?.role || 'MEMBER'
        };
      });
  },

  // Get a single team by ID
  getTeam: async (teamId: string): Promise<Team | undefined> => {
    await delay(300);
    return db.teams.find((t) => t.id === teamId);
  },

  // Get members of a specific team (enriched with User details)
  getTeamMembers: async (teamId: string): Promise<(TeamMember & { user: User })[]> => {
    await delay(500);
    const members = db.team_members.filter((m) => m.teamId === teamId && m.isActive);
    
    return members.map((member) => {
      const user = db.users.find((u) => u.id === member.userId);
      if (!user) {
        throw new Error(`User not found for member ${member.id}`);
      }
      return { ...member, user };
    });
  },

  // Get discussions for a team
  getDiscussions: async (teamId: string): Promise<Discussion[]> => {
    await delay(500);
    return db.discussions.filter((d) => d.teamId === teamId && !d.isDeleted);
  },

  // Get a single discussion by ID
  getDiscussion: async (discussionId: string): Promise<Discussion | undefined> => {
    await delay(300);
    return db.discussions.find((d) => d.id === discussionId);
  },

  // Get messages for a discussion
  getMessages: async (discussionId: string): Promise<Message[]> => {
    await delay(300);
    return db.messages
      .filter((m) => m.discussionId === discussionId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  // Send a message
  sendMessage: async (discussionId: string, senderId: string, content: string): Promise<Message> => {
    await delay(300);
    const sender = db.users.find((u) => u.id === senderId);
    if (!sender) throw new Error("Sender not found");

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      discussionId,
      content,
      sender: {
        id: sender.id,
        name: sender.name,
        avatar: sender.avatar || null,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.messages.push(newMessage);
    return newMessage;
  },

  // Create a new discussion (channel)
  createDiscussion: async (teamId: string, name: string, ownerId: string, memberIds?: string[]): Promise<Discussion> => {
    await delay(500);
    const newDiscussion: Discussion = {
      id: `discussion-${Date.now()}`,
      name,
      ownerId,
      teamId,
      isGroup: true,
      isDeleted: false,
      participants: memberIds ? [ownerId, ...memberIds] : [ownerId],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.discussions.push(newDiscussion);
    return newDiscussion;
  },

  // Get or create a direct message discussion
  getOrCreateDirectMessage: async (currentUserId: string, targetUserId: string): Promise<Discussion> => {
    await delay(500);
    
    // Check if a DM already exists
    // In a real app, we would check participants. For mock, we'll simulate it.
    // We'll assume if isGroup is false, it's a DM.
    // We'll store participants in the 'participants' field (which is jsonb/any in the interface)
    
    let dm = db.discussions.find(d => 
      !d.isGroup && 
      d.participants && 
      (d.participants as string[]).includes(currentUserId) && 
      (d.participants as string[]).includes(targetUserId)
    );

    if (dm) return dm;

    // Create new DM
    const targetUser = db.users.find(u => u.id === targetUserId);
    const newDM: Discussion = {
      id: `dm-${Date.now()}`,
      name: targetUser?.name || "Direct Message", 
      ownerId: currentUserId,
      isGroup: false,
      isDeleted: false,
      participants: [currentUserId, targetUserId],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    db.discussions.push(newDM);
    return newDM;
  },

  // Add member to team
  addMember: async (teamId: string, email: string): Promise<TeamMember> => {
    await delay(500);
    const user = db.users.find(u => u.email === email);
    if (!user) {
      throw new Error("User not found");
    }

    const existingMember = db.team_members.find(m => m.teamId === teamId && m.userId === user.id);
    if (existingMember) {
      if (existingMember.isActive) {
        throw new Error("User is already a member of this team");
      } else {
        // Reactivate
        existingMember.isActive = true;
        return existingMember;
      }
    }

    const newMember: TeamMember = {
      id: `member-${Date.now()}`,
      teamId,
      userId: user.id,
      role: MemberRole.MEMBER,
      isActive: true,
      joinedAt: new Date().toISOString(),
    };
    db.team_members.push(newMember);
    return newMember;
  },
};
