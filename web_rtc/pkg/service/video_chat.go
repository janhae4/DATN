package service

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"google.golang.org/genai"
	"gorm.io/gorm"

	"web_rtc/pkg/livekit"
	"web_rtc/pkg/models"
	"web_rtc/pkg/mq"
	"web_rtc/pkg/rabbitmq"
)

type CachedMemberState struct {
	Role     string    `json:"role"`   // MemberRole: OWNER, ADMIN, MEMBER
	Status   string    `json:"status"` // MemberStatus: ACCEPTED, PENDING...
	IsActive bool      `json:"isActive"`
	JoinedAt time.Time `json:"joinedAt"`
}

type VideoChatService struct {
	db          *gorm.DB
	rpcClient   *rabbitmq.RPCClient
	mqClient    mq.EventPublisher
	redisClient *redis.Client
	livekit     *livekit.RoomManager

	OnSummaryChunk    func(roomID string, chunk string)
	OnSummaryComplete func(roomID string)
}

func NewVideoChatService(db *gorm.DB, rpcClient *rabbitmq.RPCClient, mqClient mq.EventPublisher, redisClient *redis.Client, lk *livekit.RoomManager) *VideoChatService {
	return &VideoChatService{
		db:          db,
		rpcClient:   rpcClient,
		mqClient:    mqClient,
		redisClient: redisClient,
		livekit:     lk,
	}
}

func (s *VideoChatService) getMemberRole(teamID, userID string) (models.MemberRole, error) {
	ctx := context.Background()
	log.Println("team:members:", teamID)
	key := fmt.Sprintf("team:members:%s", teamID)

	var memberState *CachedMemberState

	jsonData, err := s.redisClient.HGet(ctx, key, userID).Result()
	log.Println("jsonData", jsonData)
	if err == nil {
		if err := json.Unmarshal([]byte(jsonData), &memberState); err != nil {
			log.Printf("Failed to unmarshal member state from redis: %v", err)
		}
	}

	if memberState == nil {
		log.Printf("Cache miss for team %s, user %s. Calling RPC...", teamID, userID)

		var freshData CachedMemberState
		errRPC := s.rpcClient.Call("team_exchange", "team.findParticipant", map[string]string{
			"teamId": teamID,
			"userId": userID,
		}, &freshData)

		if errRPC != nil || freshData.Role == "" {
			log.Printf("❌ RPC call failed or returned invalid data: %v (Data: %+v)", errRPC, freshData)
			return "", errors.New("failed to verify team permission via RPC")
		}

		memberState = &freshData
		go func() {
			data, _ := json.Marshal(memberState)
			s.redisClient.HSet(ctx, key, userID, data)
			s.redisClient.Expire(ctx, key, 24*time.Hour)
		}()
	}

	if memberState.Status != "ACCEPTED" {
		log.Println("Member status:", memberState.Status)
		return "", errors.New("you are not an accepted member of this team")
	}

	return models.MemberRole(memberState.Role), nil
}

func (s *VideoChatService) checkPermission(teamID, userID string, allowedRoles []string) error {
	role, err := s.getMemberRole(teamID, userID)
	if err != nil {
		log.Println("Error getting member role:", err)
		return err
	}

	log.Println("Role:", role)

	if len(allowedRoles) == 0 {
		allowedRoles = []string{"OWNER", "ADMIN", "MEMBER"}
	}

	isAllowed := false
	for _, r := range allowedRoles {
		if string(role) == r {
			isAllowed = true
			break
		}
	}

	if !isAllowed {
		return errors.New("you do not have permission to access this team")
	}

	return nil
}

func (s *VideoChatService) generateRoomCode() string {
	const charset = "abcdefghijklmnopqrstuvwxyz"
	b := make([]byte, 10)
	_, err := rand.Read(b)
	if err != nil {
		return strings.ReplaceAll(uuid.New().String()[:12], "-", "")[:10]
	}
	for i := range b {
		b[i] = charset[int(b[i])%len(charset)]
	}
	return fmt.Sprintf("%s-%s-%s", string(b[0:3]), string(b[3:7]), string(b[7:10]))
}

func (s *VideoChatService) CreateOrJoinCall(userID string, teamID string, refID *string, refType *string, password string, isLobbyEnabled bool) (map[string]interface{}, error) {
	log.Println("CreateOrJoinCall", userID, teamID, "Password:", password, "Lobby:", isLobbyEnabled)
	teamRole, err := s.getMemberRole(teamID, userID)
	if err != nil {
		return nil, err
	}

	// Lookup active call
	var call models.Call
	query := s.db.Where(&models.Call{TeamID: teamID}).Where("\"endedAt\" IS NULL")
	if refID != nil && refType != nil {
		query = query.Where("\"refId\" = ? AND \"refType\" = ?", *refID, *refType)
	}
	result := query.First(&call)

	if result.Error == nil {
		var participant models.CallParticipant
		err := s.db.Where(&models.CallParticipant{CallID: call.ID, UserID: userID}).First(&participant).Error
		if err == nil {
			if participant.Role == models.CallRoleBanned {
				return nil, errors.New("you are banned from this call")
			}
			if participant.LeftAt != nil {
				participant.LeftAt = nil
				s.db.Save(&participant)
			}
		} else {
			role := models.CallRoleMember
			if teamRole == models.MemberRoleOwner || teamRole == models.MemberRoleAdmin {
				role = models.CallRoleAdmin
			}

			newParticipant := models.CallParticipant{
				CallID: call.ID,
				UserID: userID,
				Role:   role,
			}
			s.db.Create(&newParticipant)
		}

		return map[string]interface{}{
			"action": "JOIN",
			"roomId": call.RoomCode,
		}, nil
	}

	// Create new call
	var newCall models.Call
	maxRetries := 5
	for i := 0; i < maxRetries; i++ {
		roomCode := s.generateRoomCode()

		// Check if RoomCode already exists
		var existingCall models.Call
		if err := s.db.Where("\"roomCode\" = ?", roomCode).First(&existingCall).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				newCall = models.Call{
					RoomCode:       roomCode,
					TeamID:         teamID,
					RefID:          refID,
					RefType:        (*models.RefType)(refType),
					Password:       password,
					IsLobbyEnabled: isLobbyEnabled,
					Participants: []models.CallParticipant{
						{
							UserID: userID,
							Role:   models.CallRoleHost,
							Status: models.ParticipantStatusJoined,
						},
					},
				}
				if err := s.db.Create(&newCall).Error; err == nil {
					return map[string]interface{}{
						"action": "CREATED",
						"roomId": newCall.RoomCode,
					}, nil
				}
				// If create still fails (rare race condition), loop will retry
			} else {
				return nil, err
			}
		}
	}

	return nil, errors.New("failed to generate a unique room code after several attempts")
}

func (s *VideoChatService) GetCallHistory(userID string) ([]models.Call, error) {
	var calls []models.Call
	err := s.db.Table("call").
		Joins("JOIN call_participant ON call_participant.\"callId\" = call.id").
		Where("call_participant.\"userId\" = ?", userID).
		Preload("Participants").
		Preload("CallTranscripts").
		Preload("CallSummaryBlocks").
		Order("\"createdAt\" DESC").
		Find(&calls).Error

	for i := range calls {
		var recs []models.CallRecording
		s.db.Where("\"callId\" = ?", calls[i].ID).Find(&recs)
	}

	return calls, err
}

func (s *VideoChatService) GetCallInfo(roomID, userID string) (*models.Call, error) {
	var call models.Call

	// Define a helper to create the preloaded query
	preloaded := func() *gorm.DB {
		return s.db.Preload("Participants").
			Preload("CallTranscripts").
			Preload("CallSummaryBlocks").
			Preload("CallActionItems").
			Preload("Recordings")
	}

	if parsedID, err := uuid.Parse(roomID); err == nil {
		if err := preloaded().First(&call, "id = ?", parsedID).Error; err == nil {
			goto found
		}
	}

	if err := preloaded().First(&call, "\"roomCode\" = ?", roomID).Error; err != nil {
		return nil, errors.New("room not found")
	}

found:
	if err := s.checkPermission(call.TeamID, userID, []string{string(models.MemberRoleAdmin), string(models.MemberRoleMember), string(models.MemberRoleOwner)}); err != nil {
		return nil, err
	}

	hasPassword := call.Password != ""
	if hasPassword {
		isAlreadyJoined := false
		var userPart *models.CallParticipant
		for i := range call.Participants {
			p := &call.Participants[i]
			if p.UserID == userID {
				userPart = p
				if p.Status == models.ParticipantStatusJoined && p.LeftAt == nil {
					isAlreadyJoined = true
				}
				break
			}
		}

		if isAlreadyJoined {
			hasPassword = false
		} else {
			if userPart != nil && (userPart.Role == models.CallRoleHost || userPart.Role == models.CallRoleAdmin) {
				hasPassword = false
			} else {
				teamRole, errRole := s.getMemberRole(call.TeamID, userID)
				if errRole == nil && (teamRole == models.MemberRoleOwner || teamRole == models.MemberRoleAdmin) {
					hasPassword = false
				}
			}
		}
	}

	// Populate virtual fields
	call.HasPassword = hasPassword

	return &call, nil
}

func (s *VideoChatService) GetCallHistoryByRoomId(roomID string) ([]models.Call, error) {
	var calls []models.Call
	err := s.db.Where("\"roomCode\" = ?", roomID).Preload("Participants").Preload("CallSummaryBlocks").Preload("CallActionItems").Find(&calls).Error
	return calls, err
}

func (s *VideoChatService) GetCallHistoryByTeamId(teamID, userID string, page, limit int) (map[string]interface{}, error) {
	// Verify permission
	if err := s.checkPermission(teamID, userID, []string{string(models.MemberRoleAdmin), string(models.MemberRoleMember), string(models.MemberRoleOwner)}); err != nil {
		return nil, err
	}

	var total int64
	s.db.Model(&models.Call{}).Where(&models.Call{TeamID: teamID}).Count(&total)

	var calls []models.Call
	err := s.db.Where(&models.Call{TeamID: teamID}).
		Preload("Participants").
		Order("\"createdAt\" DESC").
		Offset((page - 1) * limit).
		Limit(limit).
		Find(&calls).Error

	return map[string]interface{}{
		"data":  calls,
		"total": total,
		"page":  page,
		"limit": limit,
	}, err
}

func (s *VideoChatService) GetCallActionItems(callID uuid.UUID, page, limit int) (map[string]interface{}, error) {
	var total int64
	s.db.Model(&models.CallActionItem{}).Where("\"callId\" = ?", callID).Count(&total)

	var items []models.CallActionItem
	err := s.db.Where("\"callId\" = ?", callID).
		Order("\"createdAt\" DESC").
		Offset((page - 1) * limit).
		Limit(limit).
		Find(&items).Error

	return map[string]interface{}{
		"data":  items,
		"total": total,
		"page":  page,
		"limit": limit,
	}, err
}

func (s *VideoChatService) GetCallRecordings(callID uuid.UUID, page, limit int) (map[string]interface{}, error) {
	var total int64
	s.db.Model(&models.CallRecording{}).Where("\"callId\" = ?", callID).Count(&total)

	var recordings []models.CallRecording
	err := s.db.Where("\"callId\" = ?", callID).
		Order("\"startedAt\" DESC").
		Offset((page - 1) * limit).
		Limit(limit).
		Find(&recordings).Error

	return map[string]interface{}{
		"data":  recordings,
		"total": total,
		"page":  page,
		"limit": limit,
	}, err
}

func (s *VideoChatService) GetCallTranscripts(callID uuid.UUID, page, limit int) (map[string]interface{}, error) {
	var total int64
	s.db.Model(&models.CallTranscript{}).Where("\"callId\" = ?", callID).Count(&total)

	var transcripts []models.CallTranscript
	err := s.db.Where("\"callId\" = ?", callID).
		Order("\"timestamp\" ASC").
		Offset((page - 1) * limit).
		Limit(limit).
		Find(&transcripts).Error

	return map[string]interface{}{
		"data":  transcripts,
		"total": total,
		"page":  page,
		"limit": limit,
	}, err
}

func (s *VideoChatService) UpdateActionItem(itemID uuid.UUID, data map[string]interface{}) error {
	return s.db.Model(&models.CallActionItem{}).Where("id = ?", itemID).Updates(data).Error
}

func (s *VideoChatService) DeleteActionItem(itemID uuid.UUID) error {
	return s.db.Delete(&models.CallActionItem{}, "id = ?", itemID).Error
}

func (s *VideoChatService) BulkUpdateActionItemsStatus(callID uuid.UUID, status string) error {
	return s.db.Model(&models.CallActionItem{}).Where("\"callId\" = ?", callID).Update("status", status).Error
}

func (s *VideoChatService) BulkDeleteActionItems(callID uuid.UUID) error {
	return s.db.Delete(&models.CallActionItem{}, "\"callId\" = ?", callID).Error
}

func (s *VideoChatService) ValidateJoinRoom(roomID, userID, password string) (*models.Call, *models.CallParticipant, error) {
	var call models.Call
	if err := s.db.Where("\"roomCode\" = ?", roomID).Preload("Participants").First(&call).Error; err != nil {
		return nil, nil, errors.New("room not found")
	}

	if call.EndedAt != nil {
		return &call, nil, errors.New("call_ended")
	}

	var participant *models.CallParticipant
	for i := range call.Participants {
		if call.Participants[i].UserID == userID {
			participant = &call.Participants[i]
			break
		}
	}

	isAlreadyJoined := participant != nil && participant.Status == models.ParticipantStatusJoined && participant.LeftAt == nil
	canBypass := isAlreadyJoined

	if !canBypass && call.TeamID != "" {
		if participant != nil && (participant.Role == models.CallRoleHost || participant.Role == models.CallRoleAdmin) {
			canBypass = true
		} else {
			teamRole, errRole := s.getMemberRole(call.TeamID, userID)
			if errRole == nil && (teamRole == models.MemberRoleOwner || teamRole == models.MemberRoleAdmin) {
				canBypass = true
			}
		}
	}

	if call.Password != "" && !canBypass {
		if password == "" {
			return &call, nil, errors.New("password_required")
		}
		if call.Password != password {
			return &call, nil, errors.New("invalid_password")
		}
	}

	return &call, participant, nil
}

func (s *VideoChatService) ApproveJoin(requesterID, targetUserID, roomID string) (map[string]interface{}, error) {
	var call models.Call
	if err := s.db.Where("\"roomCode\" = ?", roomID).Preload("Participants").First(&call).Error; err != nil {
		return nil, errors.New("room not found")
	}

	if call.EndedAt != nil {
		return nil, errors.New("call_ended")
	}

	var requester *models.CallParticipant
	var target *models.CallParticipant
	for i := range call.Participants {
		p := &call.Participants[i]
		if p.UserID == requesterID && p.LeftAt == nil {
			requester = p
		}
		if p.UserID == targetUserID {
			target = p
		}
	}

	// Check if requester has approval rights
	if requester == nil || (requester.Role != models.CallRoleHost && requester.Role != models.CallRoleAdmin) {
		// Even if not a call admin, team owner/admin can approve
		teamRole, _ := s.getMemberRole(call.TeamID, requesterID)
		if teamRole != models.MemberRoleOwner && teamRole != models.MemberRoleAdmin {
			return nil, errors.New("permission denied")
		}
	}

	if target == nil {
		teamRole, _ := s.getMemberRole(call.TeamID, targetUserID)
		role := models.CallRoleMember
		if teamRole == models.MemberRoleOwner || teamRole == models.MemberRoleAdmin {
			role = models.CallRoleAdmin
		}
		target = &models.CallParticipant{
			CallID: call.ID,
			UserID: targetUserID,
			Role:   role,
			Status: models.ParticipantStatusJoined,
		}
		if err := s.db.Create(target).Error; err != nil {
			return nil, err
		}
	} else {
		target.Status = models.ParticipantStatusJoined
		target.LeftAt = nil
		if err := s.db.Save(target).Error; err != nil {
			return nil, err
		}
	}

	return map[string]interface{}{"success": true}, nil
}

func (s *VideoChatService) MarkParticipantJoined(roomID, userID string) error {
	var call models.Call
	if err := s.db.Where("\"roomCode\" = ?", roomID).First(&call).Error; err != nil {
		return errors.New("room not found")
	}

	var participant models.CallParticipant
	err := s.db.Where(&models.CallParticipant{CallID: call.ID, UserID: userID}).First(&participant).Error
	if err == nil {
		participant.Status = models.ParticipantStatusJoined
		participant.LeftAt = nil
		return s.db.Save(&participant).Error
	}

	teamRole, _ := s.getMemberRole(call.TeamID, userID)
	role := models.CallRoleMember
	if teamRole == models.MemberRoleOwner || teamRole == models.MemberRoleAdmin {
		role = models.CallRoleAdmin
	}

	participant = models.CallParticipant{
		CallID: call.ID,
		UserID: userID,
		Role:   role,
		Status: models.ParticipantStatusJoined,
	}
	return s.db.Create(&participant).Error
}

func (s *VideoChatService) MarkParticipantPending(roomID, userID string) error {
	var call models.Call
	if err := s.db.Where("\"roomCode\" = ?", roomID).First(&call).Error; err != nil {
		return errors.New("room not found")
	}

	var participant models.CallParticipant
	err := s.db.Where(&models.CallParticipant{CallID: call.ID, UserID: userID}).First(&participant).Error
	if err == nil {
		if participant.Status == models.ParticipantStatusJoined {
			return nil // Already joined, no need to set to pending
		}
		participant.Status = models.ParticipantStatusPending
		return s.db.Save(&participant).Error
	}

	participant = models.CallParticipant{
		CallID: call.ID,
		UserID: userID,
		Role:   models.CallRoleMember,
		Status: models.ParticipantStatusPending,
	}
	return s.db.Create(&participant).Error
}

func (s *VideoChatService) KickUser(requesterID, targetUserID, roomID string) (map[string]interface{}, error) {
	var call models.Call
	if err := s.db.Where("\"roomCode\" = ?", roomID).Preload("Participants").First(&call).Error; err != nil {
		return nil, errors.New("room not found")
	}

	var requester, target *models.CallParticipant
	for i := range call.Participants {
		p := &call.Participants[i]
		if p.UserID == requesterID && p.LeftAt == nil {
			requester = p
		}
		if p.UserID == targetUserID {
			target = p
		}
	}

	if requester == nil {
		return nil, errors.New("you are not in this room")
	}
	if target == nil {
		return nil, errors.New("target user not in this room history")
	}

	if requester.Role == models.CallRoleHost || requester.Role == models.CallRoleAdmin {
		now := time.Now()
		if target.LeftAt == nil {
			target.LeftAt = &now
		}
		target.Role = models.CallRoleBanned
		if err := s.db.Save(target).Error; err != nil {
			return nil, err
		}

		payload := map[string]interface{}{
			"targetUserId": targetUserID,
			"message":      fmt.Sprintf("You have been kicked from room %s", roomID),
			"roomId":       roomID,
		}
		s.mqClient.PublishToExchange("socket_exchange", "socket.video-call.user-kicked", payload)

		return map[string]interface{}{"success": true, "message": "User has been kicked and banned."}, nil
	}

	return nil, errors.New("permission denied")
}

func (s *VideoChatService) UnKickUser(requesterID, targetUserID, roomID string) (map[string]interface{}, error) {
	var call models.Call
	if err := s.db.Where("\"roomCode\" = ?", roomID).First(&call).Error; err != nil {
		return nil, errors.New("room not found")
	}

	var target models.CallParticipant
	if err := s.db.Where(&models.CallParticipant{CallID: call.ID, UserID: targetUserID}).First(&target).Error; err != nil {
		return nil, errors.New("user record not found")
	}

	target.Role = models.CallRoleMember

	if err := s.db.Save(&target).Error; err != nil {
		return nil, err
	}

	// Notify
	payload := map[string]interface{}{
		"targetUserId": targetUserID,
		"message":      fmt.Sprintf("You have been unbanned from %s", roomID),
	}
	s.mqClient.PublishToExchange("socket_exchange", "socket.video-call.user-unkicked", payload)

	return map[string]interface{}{"success": true, "message": "User has been unbanned."}, nil
}

func (s *VideoChatService) LeaveCall(roomID, userID string) error {
	var call models.Call
	if err := s.db.Where("\"roomCode\" = ?", roomID).First(&call).Error; err != nil {
		return errors.New("room not found")
	}

	now := time.Now()
	err := s.db.Model(&models.CallParticipant{}).
		Where(&models.CallParticipant{CallID: call.ID, UserID: userID}).
		Where("\"leftAt\" IS NULL").
		Update("leftAt", now).Error

	if err != nil {
		log.Printf("Failed to update leave time for user %s in room %s: %v", userID, roomID, err)
		return err
	}

	// Check if any participants are still in the call
	var activeCount int64
	s.db.Model(&models.CallParticipant{}).Where("\"callId\" = ? AND \"leftAt\" IS NULL", call.ID).Count(&activeCount)

	if activeCount == 0 {
		log.Printf("Meeting %s - Room %s is now empty. Ending call.", call.ID, roomID)
		s.db.Model(&models.Call{}).Where("id = ?", call.ID).Update("endedAt", now)

		// Trigger final summary on meeting end
		go func() {
			time.Sleep(2 * time.Second) // Give it a moment to ensure all late transcripts are in
			if err := s.ProcessMeetingSummary(roomID); err != nil {
				log.Printf("Final summary failed for room %s: %v", roomID, err)
			} else {
				// Notify via WebSocket that meeting has ended and summary is ready
				s.mqClient.PublishToExchange("video_chat_exchange", "video_chat.summary.updated", map[string]string{
					"roomId": roomID,
					"type":   "FINAL_SUMMARY",
				})
			}
		}()
	}

	return nil
}

// HandleTranscriptReceive processes real-time transcripts from client
func (s *VideoChatService) HandleTranscriptReceive(roomID, userID, userName, content string) error {
	ctx := context.Background()

	transcriptData := map[string]interface{}{
		"userId":    userID,
		"userName":  userName,
		"content":   content,
		"timestamp": time.Now(),
	}
	data, _ := json.Marshal(transcriptData)

	bufferKey := fmt.Sprintf("meeting_buffer:%s", roomID)

	err := s.redisClient.RPush(ctx, bufferKey, data).Err()
	if err != nil {
		log.Printf("❌ Failed to push transcript to Redis: %v", err)
		return err
	}

	lenBuffer, _ := s.redisClient.LLen(ctx, bufferKey).Result()

	log.Printf("🗣️ [%s] %s: %s (Buffer: %d/30)", roomID, userName, content, lenBuffer)

	// 2. If threshold of 30 sentences is reached, trigger summary
	if lenBuffer >= 30 {
		log.Printf("🤖 Buffer reached 30 sentences for room %s. Triggering AI Summary...", roomID)

		// Run in goroutine to not block receiving next transcripts
		go func() {
			if err := s.ProcessMeetingSummary(roomID); err != nil {
				log.Printf("❌ Failed to process real-time summary: %v", err)
			} else {
				// After summary is done, send notification via WebSocket for UI update
				s.mqClient.PublishToExchange("video_chat_exchange", "video_chat.summary.updated", map[string]string{
					"roomId": roomID,
					"type":   "LIVE_SUMMARY",
				})
			}
		}()
	}

	return nil
}

func (s *VideoChatService) ProcessMeetingSummary(roomID string) error {
	log.Printf("Processing meeting summary for Room: %s", roomID)

	var call models.Call
	if err := s.db.Where("\"roomCode\" = ?", roomID).First(&call).Error; err != nil {
		log.Printf("Call not found for room %s", roomID)
		return err
	}

	// Get transcripts from Redis directly
	ctx := context.Background()
	bufferKey := fmt.Sprintf("meeting_buffer:%s", roomID)

	// Get all messages in the list
	items, err := s.redisClient.LRange(ctx, bufferKey, 0, -1).Result()
	if err != nil {
		log.Printf("Failed to pop meeting buffer: %v", err)
		return err
	}

	// Clear buffer after retrieval
	s.redisClient.Del(ctx, bufferKey)

	if len(items) == 0 {
		return nil
	}

	var transcripts []struct {
		UserID    string    `json:"userId"`
		UserName  string    `json:"userName"`
		Content   string    `json:"content"`
		Timestamp time.Time `json:"timestamp"`
	}

	for _, item := range items {
		var t struct {
			UserID    string    `json:"userId"`
			UserName  string    `json:"userName"`
			Content   string    `json:"content"`
			Timestamp time.Time `json:"timestamp"`
		}
		if err := json.Unmarshal([]byte(item), &t); err == nil {
			transcripts = append(transcripts, t)
		}
	}

	// Format content & Extract unique participants for AI context
	var conversationText string
	participantMap := make(map[string]string) // UserID -> UserName

	// 1. Get current speakers from the buffer
	for _, t := range transcripts {
		conversationText += fmt.Sprintf("%s: %s\n", t.UserName, t.Content)
		if t.UserID != "" && t.UserName != "" {
			participantMap[t.UserID] = t.UserName
		}
	}

	// 2. Get historical speakers from the database for this call
	var historicalSpeakers []struct {
		UserID   string `gorm:"column:userId"`
		UserName string `gorm:"column:userName"`
	}
	s.db.Model(&models.CallTranscript{}).
		Select("DISTINCT \"userId\", \"userName\"").
		Where("\"callId\" = ?", call.ID).
		Scan(&historicalSpeakers)

	for _, hs := range historicalSpeakers {
		if hs.UserID != "" && hs.UserName != "" {
			participantMap[hs.UserID] = hs.UserName
		}
	}

	var participantListStr string
	for id, name := range participantMap {
		participantListStr += fmt.Sprintf("- ID: %s, Name: %s\n", id, name)
	}

	// RPC to Chatbot
	var summaryResult struct {
		Summary     string `json:"summary"`
		ActionItems []struct {
			Content   string `json:"content"`
			Assignee  *struct {
				ID   string `json:"id"`
				Name string `json:"name"`
			} `json:"assignee"`
			StartDate *string `json:"startDate"`
			EndDate   *string `json:"endDate"`
		} `json:"actionItems"`
	}

	/* TEMPORARILY COMMENTING OUT RPC CALL
	err = s.rpcClient.Call("chatbot_exchange", "chatbot.summarize_meeting", map[string]string{
		"roomId":  roomID,
		"content": conversationText,
	}, &summaryResult)
	if err != nil {
		log.Printf("Failed to summarize meeting: %v", err)
		return err
	}
	*/

	// USE OFFICIAL GENAI LIBRARY
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		log.Printf("❌ GEMINI_API_KEY is not set in .env")
		return errors.New("missing gemini api key")
	}

	ctx = context.Background()
	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey: apiKey,
	})
	if err != nil {
		log.Printf("❌ Failed to create Gemini client: %v", err)
		return err
	}

	var lastSummaryBlock models.CallSummaryBlock
	hasPreviousSummary := false
	if err := s.db.Where("\"callId\" = ?", call.ID).Order("\"createdAt\" desc").First(&lastSummaryBlock).Error; err == nil && lastSummaryBlock.Content != "" {
		hasPreviousSummary = true
	}

	prompt := `Summarize the following meeting conversation into a valid JSON object containing 2 fields: 
1. "summary": a string containing the main summary of the meeting.
2. "actionItems": an array of objects, each containing the following fields:
   - "content": the next tasks to be performed (write concisely).
    - "assignee": an object containing "id" (userId) and "name" (fullName) of the person assigned to this task (if any, otherwise null). Example: {"id": "user123", "name": "John Doe"}.
    - "startDate": expected start time in ISO 8601 format (e.g., 2026-02-23T10:00:00Z) (if any).
    - "endDate": expected end time/deadline in ISO 8601 format (if any).

LIST OF AVAILABLE PARTICIPANTS IN THIS MEETING (Use these IDs for the "assignee" field):
%s

Absolutely do not use markdown (like ` + "```json" + `), only return the raw valid JSON data.
`
	prompt = fmt.Sprintf(prompt, participantListStr)

	if hasPreviousSummary {
		prompt += fmt.Sprintf(`IMPORTANT NOTE: This is a CONTINUATION of an ongoing meeting conversation. 
		Below is the PREVIOUS SUMMARY of the meeting:
		----------
		%s
		----------
		Based on the previous summary and the NEW conversation below, create a NEW SUMMARY that includes both old and new content in a coherent way (synthesized), and update Action Items if any.
		`, lastSummaryBlock.Content)
	}

	prompt += fmt.Sprintf(`NEW conversation: %s`, conversationText)

	// Call AI via library (automatically handles url and latest supported models)
	stream := client.Models.GenerateContentStream(ctx, "gemini-2.5-flash", genai.Text(prompt), nil)
	var extractedJSONStr string
	for chunk, iterErr := range stream {
		if iterErr != nil {
			log.Printf("❌ Failed to call Gemini API (stream): %v", iterErr)
			return iterErr
		}
		if len(chunk.Candidates) > 0 && chunk.Candidates[0].Content != nil {
			for _, part := range chunk.Candidates[0].Content.Parts {
				if part.Text != "" {
					extractedJSONStr += part.Text

					// Send realtime chunk if established
					if s.OnSummaryChunk != nil {
						s.OnSummaryChunk(roomID, part.Text)
					}
				}
			}
		}
	}

	// Send stream completion signal
	if s.OnSummaryComplete != nil {
		s.OnSummaryComplete(roomID)
	}

	if extractedJSONStr == "" {
		log.Printf("❌ Gemini returned empty content part.")
		return errors.New("empty text collected from gemini parts")
	}

	// Clean JSON if Gemini returns markdown ```json ... ```
	extractedJSONStr = strings.TrimPrefix(extractedJSONStr, "```json")
	extractedJSONStr = strings.TrimSuffix(extractedJSONStr, "```")
	extractedJSONStr = strings.TrimSpace(extractedJSONStr)

	err = json.Unmarshal([]byte(extractedJSONStr), &summaryResult)
	if err != nil {
		log.Printf("❌ Failed to unmarshal Gemini JSON: %v, String: %s", err, extractedJSONStr)
		// Fallback: If JSON cannot be parsed, save whole text to summary
		summaryResult.Summary = extractedJSONStr
	}

	log.Printf("AI Summary generated for Room %s", roomID)

	// Save to DB
	err = s.db.Transaction(func(tx *gorm.DB) error {
		// Save transcripts
		for _, t := range transcripts {
			tx.Create(&models.CallTranscript{
				CallID:    call.ID,
				UserID:    t.UserID,
				UserName:  t.UserName,
				Content:   t.Content,
				Timestamp: t.Timestamp,
			})
		}

		// Save Summary
		tx.Create(&models.CallSummaryBlock{
			CallID:  call.ID,
			Content: summaryResult.Summary,
		})

		// Save Action Items
		for _, item := range summaryResult.ActionItems {
			actionItem := &models.CallActionItem{
				CallID:  call.ID,
				Content: item.Content,
				Status:  "SUGGESTED",
			}

			if item.Assignee != nil {
				if item.Assignee.ID != "" {
					actionItem.AssigneeID = &item.Assignee.ID
				}
				if item.Assignee.Name != "" {
					actionItem.AssigneeName = &item.Assignee.Name
				}
			}
			if item.StartDate != nil && *item.StartDate != "" {
				if parsedStart, err := time.Parse(time.RFC3339, *item.StartDate); err == nil {
					actionItem.StartDate = &parsedStart
				}
			}
			if item.EndDate != nil && *item.EndDate != "" {
				if parsedEnd, err := time.Parse(time.RFC3339, *item.EndDate); err == nil {
					actionItem.EndDate = &parsedEnd
				}
			}

			tx.Create(actionItem)
		}
		return nil
	})

	return err
}
