# Direct Messaging Implementation Plan

## Objective
Add a "Direct Chatting" category in ChannelList to display 1-1 conversations with team members, independent of servers.

## Requirements
- Display team members in a "Direct Messages" category
- Allow clicking on a member to start/continue 1-1 chat
- Direct messages are team-scoped, not server-scoped
- Should appear above or below server channels in ChannelList

## Implementation Steps

### 1. Frontend Changes

#### 1.1 Update ChannelList Component
**File**: `frontend/components/chatting/sidebar/ChannelList.tsx`

- Add new props:
  - `teamMembers?: ServerMemberDto[]` - list of team members
  - `onSelectDirectMessage?: (userId: string) => void` - callback for DM selection
  - `selectedDirectMessageUserId?: string | null` - currently selected DM user

- Add new state for DM category expansion
- Render "Direct Messages" category before or after server channels
- Display team members as clickable items (similar to ChannelItem)
- Show online status indicator for each member

#### 1.2 Update useChatPageLogic Hook
**File**: `frontend/hooks/chat/useChatPageLogic.ts`

- Add state: `selectedDirectMessageUserId: string | null`
- Fetch team members using existing `useServerMembers` or create new hook for team-wide members
- Add `handleSelectDirectMessage(userId: string)` action
- When DM is selected:
  - Set `selectedDirectMessageUserId`
  - Clear `selectedChannelId` and `selectedServerId`
  - Create/fetch DM discussion ID
  - Update URL params to reflect DM state

#### 1.3 Create DirectMessageItem Component
**File**: `frontend/components/chatting/sidebar/DirectMessageItem.tsx`

- Display user avatar
- Display user name
- Show online/offline status
- Show unread message count (optional)
- Highlight when selected

#### 1.4 Update ChatContainer
**File**: `frontend/components/chatting/ChatContainer.tsx`

- Pass team members to ChannelList
- Pass DM-related props and handlers
- Handle DM selection state

### 2. Backend Changes (if needed)

#### 2.1 Team Members Endpoint
Check if we need a new endpoint to fetch all team members (not just server members).

**Potential endpoint**: `GET /api/teams/:teamId/members`

#### 2.2 Direct Message Discussion Creation
May need endpoint to create/get DM discussion between two users:

**Potential endpoint**: `POST /api/teams/:teamId/direct-messages`
- Body: `{ recipientUserId: string }`
- Returns: Discussion ID for the DM

#### 2.3 Direct Message Discussions Query
Endpoint to get all DM discussions for current user in team:

**Potential endpoint**: `GET /api/teams/:teamId/direct-messages`
- Returns: List of DM discussions with last message, unread count, etc.

### 3. UI/UX Considerations

- **Category Position**: Place "Direct Messages" at the top of ChannelList (above server channels)
- **Visual Distinction**: Use different icon (lucide:user or lucide:message-circle) instead of hash
- **Online Status**: Green dot for online, gray for offline
- **Unread Badges**: Show unread count next to user name
- **Search**: Consider adding search functionality for finding team members

### 4. Data Flow

```
User clicks on team member in DM list
  ↓
handleSelectDirectMessage(userId)
  ↓
Create/fetch DM discussion ID
  ↓
Set selectedDirectMessageUserId
Clear selectedChannelId, selectedServerId
  ↓
Update URL: /{teamId}/chat?dm={userId}
  ↓
ChatArea renders messages for DM discussion
```

### 5. Migration Path

1. First implement frontend UI without backend changes
2. Use existing discussion/message infrastructure
3. Add backend endpoints if needed for optimization
4. Add real-time updates for DM notifications

## Next Steps

1. Verify existing backend endpoints for team members
2. Implement DirectMessageItem component
3. Update ChannelList to show DM category
4. Update useChatPageLogic to handle DM state
5. Test DM functionality
6. Add unread counts and online status
