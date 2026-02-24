package service

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"web_rtc/pkg/models"
	"web_rtc/pkg/storage"
)

// RecordingPermission describes what a user can do with recording in a room
type RecordingPermission struct {
	CanRecordDirectly bool   // true = HOST/ADMIN in team or call HOST → can start without request
	CallRole          string // HOST, ADMIN, MEMBER, BANNED (from call_participant DB)
	TeamRole          string // OWNER, ADMIN, MEMBER (from Redis / Team Service)
}

// GetUserRecordingPermission checks Redis (team role) + DB (call role) to determine recording rights.
//   - Team OWNER / ADMIN → can record directly
//   - Call HOST (the person who started the meeting) → can record directly
//   - Team MEMBER → must send a request to the room's HOST/ADMIN
func (s *VideoChatService) GetUserRecordingPermission(roomID, userID string) RecordingPermission {
	perm := RecordingPermission{CallRole: "MEMBER", TeamRole: "MEMBER"}

	// 1. Get call role from DB - get the most recent participant record
	// (no leftAt filter to avoid race conditions on rejoin)
	var call models.Call
	if err := s.db.Where("\"roomCode\" = ?", roomID).First(&call).Error; err == nil {
		var participant models.CallParticipant
		if err := s.db.Where(map[string]interface{}{
			"callId": call.ID,
			"userId": userID,
		}).Order(`"joinedAt" DESC`).First(&participant).Error; err == nil {
			perm.CallRole = string(participant.Role)
		}
	}

	// 2. Get team role from Redis/RPC
	if call.TeamID != "" {
		role, err := s.getMemberRole(call.TeamID, userID)
		if err == nil {
			perm.TeamRole = string(role)
		}
	}

	// Can record directly if:
	// - Team OWNER or ADMIN (high privilege in the team)
	// - OR the call HOST (person who started the meeting)
	perm.CanRecordDirectly = perm.TeamRole == "OWNER" || perm.TeamRole == "ADMIN" || perm.CallRole == "HOST"

	return perm
}

// GetUserRoleInRoom returns a simple string role for WS events
func (s *VideoChatService) GetUserRoleInRoom(roomID, userID string) string {
	perm := s.GetUserRecordingPermission(roomID, userID)
	if perm.CanRecordDirectly {
		if perm.CallRole == "HOST" {
			return "HOST"
		}
		return "ADMIN"
	}
	return "MEMBER"
}

// GetRoomPrivilegedUserIDs returns userIDs of HOST + team OWNER/ADMIN currently in the room.
// Used to route recording requests only to those who can approve.
func (s *VideoChatService) GetRoomPrivilegedUserIDs(roomID string) []string {
	var call models.Call
	if err := s.db.Where("\"roomCode\" = ?", roomID).Preload("Participants").First(&call).Error; err != nil {
		return nil
	}

	ctx := context.Background()
	key := fmt.Sprintf("team:members:%s", call.TeamID)

	privileged := []string{}
	for _, p := range call.Participants {
		if p.LeftAt != nil {
			continue // Skip participants who have left
		}
		// Call HOST is always privileged
		if p.Role == models.CallRoleHost {
			privileged = append(privileged, p.UserID)
			continue
		}
		// Check team role from Redis
		var memberState CachedMemberState
		jsonData, err := s.redisClient.HGet(ctx, key, p.UserID).Result()
		if err == nil {
			if json.Unmarshal([]byte(jsonData), &memberState) == nil {
				if memberState.Role == "OWNER" || memberState.Role == "ADMIN" {
					privileged = append(privileged, p.UserID)
				}
			}
		}
	}
	return privileged
}

// GetActiveRecording returns the currently active recording in a room (status = RECORDING), or nil
func (s *VideoChatService) GetActiveRecording(roomID string) (*models.CallRecording, error) {
	var call models.Call
	if err := s.db.Where("\"roomCode\" = ?", roomID).First(&call).Error; err != nil {
		return nil, err
	}
	var rec models.CallRecording
	if err := s.db.Where(map[string]interface{}{
		"callId": call.ID,
		"status": models.RecordingStatusRecording,
	}).First(&rec).Error; err != nil {
		return nil, nil // not found = no active recording, not an error
	}
	return &rec, nil
}

// RequestRecording - MEMBER gửi yêu cầu record
// Trả về recording ID để track
func (s *VideoChatService) RequestRecording(roomID, requestedByUserID string) (*models.CallRecording, error) {
	var call models.Call
	if err := s.db.Where("\"roomCode\" = ?", roomID).First(&call).Error; err != nil {
		return nil, errors.New("room not found")
	}

	// Check if already recording
	var existing models.CallRecording
	if err := s.db.Where(map[string]interface{}{
		"callId": call.ID,
		"status": models.RecordingStatusRecording,
	}).First(&existing).Error; err == nil {
		return nil, errors.New("recording already in progress")
	}

	// Create pending recording record (status RECORDING will be set on approval)
	rec := &models.CallRecording{
		CallID:      call.ID,
		RequestedBy: requestedByUserID,
		Status:      "PENDING", // Waiting for approval
	}
	if err := s.db.Create(rec).Error; err != nil {
		return nil, fmt.Errorf("failed to create recording record: %w", err)
	}

	log.Printf("Recording requested by %s in room %s (id: %s)", requestedByUserID, roomID, rec.ID)
	return rec, nil
}

// ApproveRecording - HOST/ADMIN đồng ý cho record
func (s *VideoChatService) ApproveRecording(recordingID, approverID string) (*models.CallRecording, error) {
	uid, err := uuid.Parse(recordingID)
	if err != nil {
		return nil, errors.New("invalid recording id")
	}

	var rec models.CallRecording
	if err := s.db.Preload("Call").First(&rec, "id = ?", uid).Error; err != nil {
		return nil, errors.New("recording request not found")
	}

	if rec.Status != "PENDING" {
		return nil, errors.New("recording request is not pending")
	}

	// RBAC is already validated by hub.go before calling this function.
	// We trust the caller is privileged (HOST, team OWNER/ADMIN).
	// Just find the participant to get their info for logging.
	var participant models.CallParticipant
	_ = s.db.Where(map[string]interface{}{
		"callId": rec.CallID,
		"userId": approverID,
	}).Order(`"joinedAt" DESC`).First(&participant)

	now := time.Now()
	rec.ApprovedBy = &approverID
	rec.Status = models.RecordingStatusRecording
	rec.StartedAt = now

	if err := s.db.Save(&rec).Error; err != nil {
		return nil, fmt.Errorf("failed to approve recording: %w", err)
	}

	log.Printf("Recording %s approved by %s. Triggering LiveKit Egress...", recordingID, approverID)

	// Trigger LiveKit Egress
	timestamp := time.Now().Format("20060102_150405")
	filepath := fmt.Sprintf("%s/%s.mp4", rec.Call.RoomCode, timestamp)

	egressID, err := s.livekit.StartRoomRecording(rec.Call.RoomCode, filepath)
	if err != nil {
		log.Printf("⚠️ Failed to start LiveKit Egress: %v", err)
	} else {
		log.Printf("✅ LiveKit Egress started: %s", egressID)
		rec.EgressID = &egressID

		// Predict the file URL (Minio setup)
		minioPublic := os.Getenv("MINIO_ENDPOINT_PUBLIC")
		if minioPublic == "" {
			minioPublic = "http://localhost:9000"
		}
		bucketName := os.Getenv("MINIO_RECORDING_BUCKET")
		if bucketName == "" {
			bucketName = "meeting-recordings"
		}
		fileURL := fmt.Sprintf("%s/%s/%s", minioPublic, bucketName, filepath)
		rec.FileURL = &fileURL

		s.db.Save(&rec)
	}

	return &rec, nil
}

// RejectRecording - HOST/ADMIN từ chối record
func (s *VideoChatService) RejectRecording(recordingID, rejectorID string) error {
	uid, err := uuid.Parse(recordingID)
	if err != nil {
		return errors.New("invalid recording id")
	}

	if err := s.db.Model(&models.CallRecording{}).
		Where("id = ? AND status = 'PENDING'", uid).
		Updates(map[string]interface{}{
			"status":     "REJECTED",
			"approvedBy": rejectorID,
		}).Error; err != nil {
		return fmt.Errorf("failed to reject recording: %w", err)
	}

	return nil
}

// EndRecording - Mark recording as STOPPED when user clicks stop
func (s *VideoChatService) EndRecording(recordingID, stoppedBy string) error {
	uid, err := uuid.Parse(recordingID)
	if err != nil {
		return errors.New("invalid recording id")
	}

	var rec models.CallRecording
	if err := s.db.First(&rec, "id = ?", uid).Error; err != nil {
		return err
	}

	var participant models.CallParticipant
	if err := s.db.Preload("Call").First(
		&participant,
		&models.CallParticipant{
			CallID: rec.CallID,
			UserID: stoppedBy,
		}).Error; err != nil {
		return fmt.Errorf("failed to fetch user permissions: %w", err)
	}

	// 1. Kiểm tra Team Role (Owner hoặc Admin team được phép)
	teamRole, _ := s.getMemberRole(participant.Call.TeamID, stoppedBy)
	isTeamPrivileged := teamRole == models.MemberRoleOwner || teamRole == models.MemberRoleAdmin

	// 2. Kiểm tra Call Role (Chỉ Host mới được phép)
	isHost := participant.Role == models.CallRoleHost

	if !isTeamPrivileged && !isHost {
		return errors.New("permission denied: only host, team owner or team admin can stop recording")
	}

	if rec.EgressID != nil {
		log.Printf("Stopping LiveKit Egress %s...", *rec.EgressID)
		if err := s.livekit.StopRoomRecording(*rec.EgressID); err != nil {
			log.Printf("⚠️ Failed to stop LiveKit Egress: %v", err)
		}
	}

	now := time.Now()
	if err := s.db.Model(&models.CallRecording{}).
		Where("id = ? AND status = ?", uid, models.RecordingStatusRecording).
		Updates(map[string]interface{}{
			"status":  models.RecordingStatusStopped,
			"endedAt": &now,
		}).Error; err != nil {
		return fmt.Errorf("failed to end recording: %w", err)
	}

	return nil
}

// FinishRecording - CLIENT upload xong, lưu URL và đánh dấu COMPLETED
func (s *VideoChatService) FinishRecording(recordingID string, fileData []byte, mimeType string) (*models.CallRecording, error) {
	uid, err := uuid.Parse(recordingID)
	if err != nil {
		return nil, errors.New("invalid recording id")
	}

	var rec models.CallRecording
	if err := s.db.Preload("Call").First(&rec, "id = ?", uid).Error; err != nil {
		return nil, errors.New("recording not found")
	}

	if rec.Status != models.RecordingStatusRecording && rec.Status != models.RecordingStatusStopped {
		return nil, errors.New("recording is not in a finishable state (RECORDING or STOPPED)")
	}

	// Upload to MinIO
	minio := storage.GetMinio()
	if minio == nil {
		return nil, errors.New("storage not initialized")
	}

	now := time.Now()
	timestamp := now.Format("20060102_150405")
	objectName := fmt.Sprintf("%s/%s.webm",
		rec.Call.RoomCode,
		timestamp,
	)

	if mimeType == "" {
		mimeType = "video/webm"
	}

	ctx := context.Background()
	log.Printf("📤 Manually uploading recording to MinIO: %s (%d bytes, %s)", objectName, len(fileData), mimeType)
	fileURL, err := minio.UploadRecording(ctx, objectName, bytes.NewReader(fileData), int64(len(fileData)), mimeType)
	if err != nil {
		log.Printf("❌ Failed to upload recording to MinIO: %v", err)
		// Mark as failed
		s.db.Model(&rec).Updates(map[string]interface{}{
			"status":  models.RecordingStatusFailed,
			"endedAt": now,
		})
		return nil, fmt.Errorf("failed to upload recording: %w", err)
	}
	log.Printf("✅ Recording uploaded successfully. URL: %s", fileURL)

	sizeKB := int64(len(fileData)) / 1024

	// Update record
	if err := s.db.Model(&rec).Updates(map[string]interface{}{
		"status":     models.RecordingStatusCompleted,
		"endedAt":    now,
		"fileUrl":    fileURL,
		"fileSizeKB": sizeKB,
		"mimeType":   mimeType,
	}).Error; err != nil {
		return nil, err
	}

	rec.Status = models.RecordingStatusCompleted
	rec.EndedAt = &now
	rec.FileURL = &fileURL
	rec.FileSizeKB = &sizeKB

	log.Printf("✅ Recording %s completed. URL: %s (%.2f MB)", recordingID, fileURL, float64(sizeKB)/1024)

	// Update Call's recording relation & also add to call history
	s.db.Model(&models.Call{}).Where("id = ?", rec.CallID).
		Update("updatedAt", gorm.Expr("NOW()"))

	return &rec, nil
}

// GetRecordingsByRoom - lấy danh sách recordings của 1 room
func (s *VideoChatService) GetRecordingsByRoom(roomID string) ([]models.CallRecording, error) {
	var call models.Call
	if err := s.db.Where("\"roomCode\" = ?", roomID).First(&call).Error; err != nil {
		return nil, errors.New("room not found")
	}

	var recordings []models.CallRecording
	if err := s.db.Where("callId = ? AND status = ?", call.ID, models.RecordingStatusCompleted).
		Order("startedAt DESC").
		Find(&recordings).Error; err != nil {
		return nil, err
	}

	return recordings, nil
}

// HandleLiveKitWebhook processes events from LiveKit Egress/Room services
func (s *VideoChatService) HandleLiveKitWebhook(event map[string]interface{}) error {
	eventStr, _ := event["event"].(string)
	log.Printf("📥 LiveKit Webhook received: %s", eventStr)

	switch eventStr {
	case "egress_updated", "egress_ended":
		egressInfo, ok := event["egressInfo"].(map[string]interface{})
		if !ok {
			return nil
		}

		egressID, _ := egressInfo["egress_id"].(string)
		status, _ := egressInfo["status"].(string) // e.g., "EGRESS_COMPLETE", "EGRESS_FAILED"

		if egressID == "" {
			return nil
		}

		var rec models.CallRecording
		if err := s.db.Where("egressId = ?", egressID).First(&rec).Error; err != nil {
			log.Printf("⚠️ Webhook: Recording with egressId %s not found in DB", egressID)
			return nil
		}

		updates := map[string]interface{}{}

		// LiveKit Egress Statuses: EGRESS_STARTING, EGRESS_ACTIVE, EGRESS_ENDING, EGRESS_COMPLETE, EGRESS_FAILED, EGRESS_ABORTED
		if status == "EGRESS_COMPLETE" {
			updates["status"] = models.RecordingStatusCompleted
			// Get file URL from egressInfo
			if file, ok := egressInfo["file"].(map[string]interface{}); ok {
				if location, ok := file["location"].(string); ok {
					// The location might be the bucket path or URL depending on config.
					// Since we configured S3, Egress usually provides the final path.
					// We construct the public URL for MinIO access.
					minioPublic := os.Getenv("MINIO_ENDPOINT_PUBLIC")
					if minioPublic == "" {
						minioPublic = "http://localhost:9000"
					}
					bucket := os.Getenv("MINIO_RECORDING_BUCKET")
					if bucket == "" {
						bucket = "meeting-recordings"
					}

					// Construct public URL
					updates["fileUrl"] = fmt.Sprintf("%s/%s/%s", minioPublic, bucket, location)
				}
				if size, ok := file["size"].(float64); ok {
					updates["fileSizeKB"] = int64(size / 1024)
				}
			}
		} else if status == "EGRESS_FAILED" {
			updates["status"] = models.RecordingStatusFailed
		}

		if len(updates) > 0 {
			if err := s.db.Model(&rec).Updates(updates).Error; err != nil {
				return err
			}
			log.Printf("✅ Updated recording %s status to %s via Webhook", rec.ID, updates["status"])
		}
	}

	return nil
}
