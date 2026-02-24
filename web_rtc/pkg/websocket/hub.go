package websocket

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"sync"
	"time"
	"web_rtc/pkg/livekit"
	"web_rtc/pkg/mq"
	"web_rtc/pkg/rabbitmq"
	"web_rtc/pkg/service"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins in development
	},
}

type Client struct {
	conn     *websocket.Conn
	send     chan []byte
	hub      *Hub
	userID   string
	userName string
	roomID   string
	role     string // string to avoid dependency cycle if any, or use models.CallRole
}

type Hub struct {
	clients          map[string]*Client            // userID -> Client
	rooms            map[string]map[string]*Client // roomID -> userID -> Client
	broadcast        chan *Message
	register         chan *Client
	unregister       chan *Client
	mu               sync.RWMutex
	authClient       *rabbitmq.AuthClient
	mqClient         mq.EventPublisher
	recordingService *service.VideoChatService
	roomManager      *livekit.RoomManager
}

type Message struct {
	Type    string                 `json:"type"`
	RoomID  string                 `json:"roomId,omitempty"`
	UserID  string                 `json:"userId,omitempty"`
	Payload map[string]interface{} `json:"payload,omitempty"`
}

type ChatMessage struct {
	RoomID    string `json:"roomId"`
	UserID    string `json:"userId"`
	UserName  string `json:"userName"`
	Content   string `json:"content"`
	Timestamp string `json:"timestamp"`
}

func NewHub(authClient *rabbitmq.AuthClient, mqClient mq.EventPublisher, recService *service.VideoChatService, livekitRM *livekit.RoomManager) *Hub {
	return &Hub{
		clients:          make(map[string]*Client),
		rooms:            make(map[string]map[string]*Client),
		broadcast:        make(chan *Message, 256),
		register:         make(chan *Client),
		unregister:       make(chan *Client),
		authClient:       authClient,
		mqClient:         mqClient,
		recordingService: recService,
		roomManager:      livekitRM,
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client.userID] = client
			if h.rooms[client.roomID] == nil {
				h.rooms[client.roomID] = make(map[string]*Client)
			}
			h.rooms[client.roomID][client.userID] = client
			h.mu.Unlock()
			log.Printf("Client registered: %s in room %s", client.userID, client.roomID)

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client.userID]; ok {
				// Broadcast user_left_video to others in the same room BEFORE removing
				if client.roomID != "" {
					leftMsg, _ := json.Marshal(&Message{
						Type:   "user_left_video",
						RoomID: client.roomID,
						Payload: map[string]interface{}{
							"userId":   client.userID,
							"socketId": client.userID,
						},
					})
					if room, ok := h.rooms[client.roomID]; ok {
						for uid, peer := range room {
							if uid != client.userID {
								select {
								case peer.send <- leftMsg:
								default:
								}
							}
						}
					}
				}

				// Publish Leave event to RabbitMQ
				h.mqClient.PublishToExchange("video_chat_exchange", "video_chat.room.leave", map[string]string{
					"roomId": client.roomID,
					"userId": client.userID,
				})

				delete(h.clients, client.userID)
				if room, ok := h.rooms[client.roomID]; ok {
					delete(room, client.userID)
					if len(room) == 0 {
						delete(h.rooms, client.roomID)
					}
				}
				close(client.send)
				log.Printf("Client unregistered: %s from room %s", client.userID, client.roomID)
			}
			h.mu.Unlock()

		case message := <-h.broadcast:
			h.mu.RLock()
			room := h.rooms[message.RoomID]
			h.mu.RUnlock()

			data, _ := json.Marshal(message)
			for _, client := range room {
				select {
				case client.send <- data:
				default:
					close(client.send)
					h.mu.Lock()
					delete(h.clients, client.userID)
					delete(room, client.userID)
					h.mu.Unlock()
				}
			}
		}
	}
}

func (h *Hub) SendToUser(userID string, message *Message) {
	h.mu.RLock()
	client, ok := h.clients[userID]
	h.mu.RUnlock()

	if ok {
		data, _ := json.Marshal(message)
		select {
		case client.send <- data:
		default:
			close(client.send)
			h.mu.Lock()
			delete(h.clients, client.userID)
			if room, exists := h.rooms[client.roomID]; exists {
				delete(room, client.userID)
			}
			h.mu.Unlock()
		}
	}
}

func (h *Hub) BroadcastToRoomExcept(message *Message, exceptUserID string) {
	h.mu.RLock()
	room, ok := h.rooms[message.RoomID]
	h.mu.RUnlock()

	if !ok {
		return
	}

	data, _ := json.Marshal(message)
	for userID, client := range room {
		if userID == exceptUserID {
			continue
		}
		select {
		case client.send <- data:
		default:
			close(client.send)
			h.mu.Lock()
			delete(h.clients, client.userID)
			delete(room, client.userID)
			h.mu.Unlock()
		}
	}
}

func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	for {
		_, msgBytes, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		var msg Message
		if err := json.Unmarshal(msgBytes, &msg); err != nil {
			log.Printf("Failed to unmarshal message: %v", err)
			continue
		}

		// Ensure payload is not nil to avoid panics
		if msg.Payload == nil {
			msg.Payload = make(map[string]interface{})
		}

		// Handle different message types
		switch msg.Type {
		case "chat_message":
			msg.UserID = c.userID
			msg.Payload["userName"] = c.userName

			if targetID, ok := msg.Payload["targetUserId"].(string); ok && targetID != "" {
				// Private message mode
				msg.Payload["isPrivate"] = true

				// Find target name
				c.hub.mu.RLock()
				if targetClient, ok := c.hub.clients[targetID]; ok {
					msg.Payload["targetUserName"] = targetClient.userName
				}
				c.hub.mu.RUnlock()

				// Send to the target user
				c.hub.SendToUser(targetID, &msg)

				// Also send back to the sender
				c.hub.SendToUser(c.userID, &msg)
			} else {
				// Broadcast chat message to room
				c.hub.broadcast <- &msg
			}

		case "join_room":
			// Update client's room
			if roomID, ok := msg.Payload["roomId"].(string); ok {
				c.hub.mu.Lock()
				// Remove from old room
				if oldRoom, exists := c.hub.rooms[c.roomID]; exists {
					delete(oldRoom, c.userID)
					if len(oldRoom) == 0 {
						delete(c.hub.rooms, c.roomID)
					}
				}
				// Add to new room
				c.roomID = roomID
				if c.hub.rooms[roomID] == nil {
					c.hub.rooms[roomID] = make(map[string]*Client)
				}
				c.hub.rooms[roomID][c.userID] = c
				// Extract userName from userInfo if available
				if userInfo, ok := msg.Payload["userInfo"].(map[string]interface{}); ok {
					if name, ok := userInfo["name"].(string); ok {
						c.userName = name
					}
				}
				c.hub.mu.Unlock()
				log.Printf("Client %s joined room %s", c.userID, roomID)
			}

		// --- Video Chat & Signaling ---

		case "join_video_room":
			roomID, _ := msg.Payload["roomId"].(string)
			password, _ := msg.Payload["password"].(string)

			// Extract userName early for knocking/logging
			if userInfo, ok := msg.Payload["userInfo"].(map[string]interface{}); ok {
				if name, ok := userInfo["name"].(string); ok {
					c.userName = name
				}
			}

			if roomID != "" {
				// 1. Validate join (Password & Existence)
				call, participant, err := c.hub.recordingService.ValidateJoinRoom(roomID, c.userID, password)
				if err != nil {
					code := "JOIN_DENIED"
					if err.Error() == "password_required" {
						code = "PASSWORD_REQUIRED"
					} else if err.Error() == "invalid_password" {
						code = "INVALID_PASSWORD"
					} else if err.Error() == "call_ended" {
						code = "CALL_ENDED"
					}
					c.hub.SendToUser(c.userID, &Message{
						Type: "join_error",
						Payload: map[string]interface{}{
							"message": err.Error(),
							"code":    code,
						},
					})
					continue
				}

				// Get team/call permissions
				perm := c.hub.recordingService.GetUserRecordingPermission(roomID, c.userID)
				// Team OWNER/ADMIN or Call HOST/ADMIN can bypass lobby
				isPrivileged := perm.TeamRole == "OWNER" || perm.TeamRole == "ADMIN" || (participant != nil && (participant.Role == "HOST" || participant.Role == "ADMIN"))

				// 2. Check Lobby (Knocking)
				if call.IsLobbyEnabled && !isPrivileged && (participant == nil || participant.Status != "JOINED") {
					// User must wait in lobby
					// Mark as pending in DB
					c.hub.recordingService.MarkParticipantPending(roomID, c.userID)

					c.hub.SendToUser(c.userID, &Message{
						Type:   "join_pending",
						RoomID: roomID,
						Payload: map[string]interface{}{
							"message": "Waiting for host to approve...",
						},
					})

					// Notify Privileged users in the room
					c.hub.mu.RLock()
					if roomClients, ok := c.hub.rooms[roomID]; ok {
						for _, client := range roomClients {
							// Check if this client is a host/admin (privileged)
							if client.role == "HOST" || client.role == "ADMIN" {
								c.hub.SendToUser(client.userID, &Message{
									Type:   "user_knocking",
									RoomID: roomID,
									Payload: map[string]interface{}{
										"userId":   c.userID,
										"userName": c.userName,
									},
								})
							}
						}
					}
					c.hub.mu.RUnlock()
					continue
				}

				// 3. Proceed with joining
				c.hub.mu.Lock()
				if c.roomID != roomID {
					if oldRoom, exists := c.hub.rooms[c.roomID]; exists {
						delete(oldRoom, c.userID)
						if len(oldRoom) == 0 {
							delete(c.hub.rooms, c.roomID)
						}
					}
					c.roomID = roomID
					if c.hub.rooms[roomID] == nil {
						c.hub.rooms[roomID] = make(map[string]*Client)
					}
					c.hub.rooms[roomID][c.userID] = c
				}

				c.hub.mu.Unlock()

				// Mark as joined in DB
				c.hub.recordingService.MarkParticipantJoined(roomID, c.userID)

				// Determine Role
				role := "MEMBER"
				if c.hub.recordingService != nil {
					role = c.hub.recordingService.GetUserRoleInRoom(roomID, c.userID)
					// perm is already fetched above
				}
				c.role = role

				// Broadcast to others
				broadcastMsg := &Message{
					Type:   "user_joined_video",
					RoomID: roomID,
					Payload: map[string]interface{}{
						"userInfo": msg.Payload["userInfo"],
						"socketId": c.userID,
						"role":     role,
					},
				}
				c.hub.BroadcastToRoomExcept(broadcastMsg, c.userID)

				// Generate Token
				var lkToken string
				if c.hub.roomManager != nil {
					displayName := c.userName
					if displayName == "" {
						displayName = c.userID
					}
					lkToken, _ = c.hub.roomManager.GetJoinToken(roomID, c.userID, displayName)
				}

				c.hub.SendToUser(c.userID, &Message{
					Type:   "your_room_role",
					RoomID: roomID,
					Payload: map[string]interface{}{
						"callRole":          role,
						"teamRole":          perm.TeamRole,
						"canRecordDirectly": perm.CanRecordDirectly,
						"livekitToken":      lkToken,
					},
				})

				// Notify of active recording
				if c.hub.recordingService != nil {
					if activeRec, err := c.hub.recordingService.GetActiveRecording(roomID); err == nil && activeRec != nil {
						c.hub.SendToUser(c.userID, &Message{
							Type:   "recording_in_progress",
							RoomID: roomID,
							Payload: map[string]interface{}{
								"recordingId": activeRec.ID.String(),
								"startedAt":   activeRec.StartedAt,
							},
						})
					}
				}
			}

		case "approve_join":
			roomID, _ := msg.Payload["roomId"].(string)
			targetUserID, _ := msg.Payload["targetUserId"].(string)
			if roomID != "" && targetUserID != "" {
				_, err := c.hub.recordingService.ApproveJoin(c.userID, targetUserID, roomID)
				if err == nil {
					// Notify the waiting user
					c.hub.SendToUser(targetUserID, &Message{
						Type:   "join_approved",
						RoomID: roomID,
					})

					// Notify hosts to remove from list
					c.hub.broadcast <- &Message{
						Type:   "knocker_removed",
						RoomID: roomID,
						Payload: map[string]interface{}{
							"userId": targetUserID,
						},
					}
				}
			}

		case "reject_join":
			roomID, _ := msg.Payload["roomId"].(string)
			targetUserID, _ := msg.Payload["targetUserId"].(string)
			if roomID != "" && targetUserID != "" {
				// Notify hosts to remove from list
				c.hub.broadcast <- &Message{
					Type:   "knocker_removed",
					RoomID: roomID,
					Payload: map[string]interface{}{
						"userId": targetUserID,
					},
				}

				// Send notification to the user
				c.hub.SendToUser(targetUserID, &Message{
					Type: "join_error",
					Payload: map[string]interface{}{
						"message": "Your request to join was rejected by the host.",
						"code":    "REJECTED",
					},
				})
			}

		case "user_toggle_audio":
			roomIDStr, _ := msg.Payload["roomId"].(string)
			if roomIDStr == "" {
				roomIDStr = c.roomID
			}
			msg.RoomID = roomIDStr
			msg.Payload["userId"] = c.userID
			c.hub.BroadcastToRoomExcept(&msg, c.userID)

		case "remote_toggle_audio", "remote_toggle_video":
			if targetID, ok := msg.Payload["targetUserId"].(string); ok {
				msg.Payload["requestedBy"] = c.userID
				c.hub.SendToUser(targetID, &msg)
			}

		case "offer":
			if targetID, ok := msg.Payload["targetUserId"].(string); ok {
				msg.Payload["senderId"] = c.userID
				msg.Payload["senderSocketId"] = c.userID
				c.hub.SendToUser(targetID, &msg)
				log.Printf("Signaling: Offer from %s to %s", c.userID, targetID)
			}

		case "answer":
			if targetID, ok := msg.Payload["targetUserId"].(string); ok {
				msg.Payload["senderId"] = c.userID
				msg.Payload["senderSocketId"] = c.userID
				c.hub.SendToUser(targetID, &msg)
			}

		case "ice_candidate":
			if targetID, ok := msg.Payload["targetUserId"].(string); ok {
				msg.Payload["senderId"] = c.userID
				msg.Payload["senderSocketId"] = c.userID
				c.hub.SendToUser(targetID, &msg)
			}

		case "req_start_speech_ai":
			if roomID, ok := msg.Payload["roomId"].(string); ok {
				msg.RoomID = roomID
				// Broadcast to room
				c.hub.BroadcastToRoomExcept(&msg, c.userID)
			}

		case "send_transcript":
			// Publish to RabbitMQ
			if roomID, ok := msg.Payload["roomId"].(string); ok {
				content, _ := msg.Payload["content"].(string)
				event := map[string]interface{}{
					"roomId":    roomID,
					"userId":    c.userID,
					"userName":  c.userName, // Thêm tên người nói
					"content":   content,
					"timestamp": time.Now().Format(time.RFC3339),
				}
				// Exchange: video_chat_exchange, Key: video_chat.transcript.receive
				c.hub.mqClient.PublishToExchange("video_chat_exchange", "video_chat.transcript.receive", event)
			}

		case "end_call":
			if roomID, ok := msg.Payload["roomId"].(string); ok {
				event := map[string]interface{}{
					"roomId": roomID,
				}
				// Exchange: video_chat_exchange, Key: video_chat.call.end
				c.hub.mqClient.PublishToExchange("video_chat_exchange", "video_chat.call.end", event)
			}

		case "request-kick":
			// Send to host user
			if hostID, ok := msg.Payload["hostUserId"].(string); ok { // Assuming payload has hostUserId like original
				// Or if targetUserId is the user to be kicked...
				// Re-reading original TS: sendKickRequestToHost(hostUserId, ...)
				// Frontend sends: { hostUserId, message, roomId, targetUserId }
				c.hub.SendToUser(hostID, &msg)
			}

		case "request-unkick":
			if hostID, ok := msg.Payload["hostUserId"].(string); ok {
				c.hub.SendToUser(hostID, &msg)
			}

		case "kick_user": // notifyUserKicked actions
			if targetID, ok := msg.Payload["targetUserId"].(string); ok {
				// 1. Tell target they are kicked
				kickMsg := &Message{
					Type: "you-are-kicked",
					Payload: map[string]interface{}{
						"message": msg.Payload["message"],
					},
				}
				c.hub.SendToUser(targetID, kickMsg)

				// 2. Tell room user left
				roomMsg := &Message{
					Type:   "user_left_video",
					RoomID: c.roomID, // Or from payload
					Payload: map[string]interface{}{
						"userId":   targetID,
						"socketId": nil,
						"reason":   "KICKED",
					},
				}
				if rID, ok := msg.Payload["roomId"].(string); ok {
					roomMsg.RoomID = rID
				}
				c.hub.broadcast <- roomMsg // Broadcast to everyone including sender

				// 3. Force disconnect target? (Optional, skipping for now as 'you-are-kicked' should handle it on client)
			}

		case "unkick_user": // notifyUserUnKicked
			if targetID, ok := msg.Payload["targetUserId"].(string); ok {
				unkickMsg := &Message{
					Type: "you-are-unkicked",
					Payload: map[string]interface{}{
						"message": msg.Payload["message"],
					},
				}
				c.hub.SendToUser(targetID, unkickMsg)
			}

		// ── Recording signaling ──────────────────────────────────────

		case "request_recording":
			// Any member can request - server checks and routes to privileged users only
			if c.hub.recordingService == nil {
				break
			}
			roomIDStr, _ := msg.Payload["roomId"].(string)
			if roomIDStr == "" {
				roomIDStr = c.roomID
			}
			// Check requester is not already privileged (should use direct start)
			requesterPerm := c.hub.recordingService.GetUserRecordingPermission(roomIDStr, c.userID)
			if requesterPerm.CanRecordDirectly {
				c.hub.SendToUser(c.userID, &Message{
					Type:    "recording_error",
					Payload: map[string]interface{}{"message": "You can start recording directly without requesting"},
				})
				break
			}
			rec, err := c.hub.recordingService.RequestRecording(roomIDStr, c.userID)
			if err != nil {
				log.Printf("RequestRecording error: %v", err)
				c.hub.SendToUser(c.userID, &Message{
					Type:    "recording_error",
					Payload: map[string]interface{}{"message": err.Error()},
				})
				break
			}
			// Route request ONLY to privileged users (HOST + team OWNER/ADMIN in this room)
			privilegedIDs := c.hub.recordingService.GetRoomPrivilegedUserIDs(roomIDStr)
			notifyMsg := &Message{
				Type:   "recording_requested",
				RoomID: roomIDStr,
				Payload: map[string]interface{}{
					"recordingId":   rec.ID.String(),
					"requestedBy":   c.userID,
					"requestedName": c.userName,
					"roomId":        roomIDStr,
				},
			}
			if len(privilegedIDs) == 0 {
				// No privileged users online - broadcast to whole room as fallback
				c.hub.BroadcastToRoomExcept(notifyMsg, c.userID)
			} else {
				for _, uid := range privilegedIDs {
					if uid != c.userID {
						c.hub.SendToUser(uid, notifyMsg)
					}
				}
			}

		case "start_recording_direct":
			// Team OWNER/ADMIN or call HOST starts recording without approval
			if c.hub.recordingService == nil {
				break
			}
			perm := c.hub.recordingService.GetUserRecordingPermission(c.roomID, c.userID)
			if !perm.CanRecordDirectly {
				c.hub.SendToUser(c.userID, &Message{
					Type:    "recording_error",
					Payload: map[string]interface{}{"message": "Only HOST or team OWNER/ADMIN can start recording directly"},
				})
				break
			}
			rec, err := c.hub.recordingService.RequestRecording(c.roomID, c.userID)
			if err != nil {
				c.hub.SendToUser(c.userID, &Message{
					Type:    "recording_error",
					Payload: map[string]interface{}{"message": err.Error()},
				})
				break
			}
			rec, err = c.hub.recordingService.ApproveRecording(rec.ID.String(), c.userID)
			if err != nil {
				c.hub.SendToUser(c.userID, &Message{
					Type:    "recording_error",
					Payload: map[string]interface{}{"message": err.Error()},
				})
				break
			}
			c.hub.broadcast <- &Message{
				Type:   "recording_approved",
				RoomID: c.roomID,
				Payload: map[string]interface{}{
					"recordingId": rec.ID.String(),
					"approvedBy":  c.userID,
					"startedAt":   rec.StartedAt,
				},
			}
			log.Printf("Direct recording %s started by %s (callRole=%s, teamRole=%s) in room %s",
				rec.ID, c.userID, perm.CallRole, perm.TeamRole, c.roomID)

		case "approve_recording":
			// Privileged user approves a pending request
			if c.hub.recordingService == nil {
				break
			}
			recordingID, _ := msg.Payload["recordingId"].(string)
			requestedBy, _ := msg.Payload["requestedBy"].(string)
			if recordingID == "" {
				break
			}
			// RBAC via Redis + DB
			perm := c.hub.recordingService.GetUserRecordingPermission(c.roomID, c.userID)
			if !perm.CanRecordDirectly {
				c.hub.SendToUser(c.userID, &Message{
					Type:    "recording_error",
					Payload: map[string]interface{}{"message": "Only HOST or team OWNER/ADMIN can approve recording"},
				})
				break
			}
			rec, err := c.hub.recordingService.ApproveRecording(recordingID, c.userID)
			if err != nil {
				log.Printf("ApproveRecording error: %v", err)
				c.hub.SendToUser(c.userID, &Message{
					Type:    "recording_error",
					Payload: map[string]interface{}{"message": err.Error()},
				})
				break
			}
			c.hub.broadcast <- &Message{
				Type:   "recording_approved",
				RoomID: c.roomID,
				Payload: map[string]interface{}{
					"recordingId": rec.ID.String(),
					"approvedBy":  c.userID,
					"requestedBy": requestedBy,
					"startedAt":   rec.StartedAt,
				},
			}
			log.Printf("Recording %s approved by %s in room %s", recordingID, c.userID, c.roomID)

		case "reject_recording":
			// HOST/ADMIN rejects
			if c.hub.recordingService == nil {
				break
			}
			recordingID, _ := msg.Payload["recordingId"].(string)
			requesterId, _ := msg.Payload["requestedBy"].(string)
			if recordingID == "" {
				break
			}
			_ = c.hub.recordingService.RejectRecording(recordingID, c.userID)
			// Notify the requester
			if requesterId != "" {
				c.hub.SendToUser(requesterId, &Message{
					Type: "recording_rejected",
					Payload: map[string]interface{}{
						"recordingId": recordingID,
						"rejectedBy":  c.userID,
						"message":     "Your recording request was declined",
					},
				})
			}

		case "stop_recording":
			// HOST/ADMIN/requester stops the active recording → notify whole room
			if c.hub.recordingService == nil {
				break
			}
			recordingID, _ := msg.Payload["recordingId"].(string)
			if recordingID == "" {
				break
			}
			// RBAC: only privileged users can force-stop (any member can stop their own)
			perm := c.hub.recordingService.GetUserRecordingPermission(c.roomID, c.userID)
			stoppedByPrivileged := perm.CanRecordDirectly

			// Mark as completed in DB (status STOPPED)
			_ = c.hub.recordingService.EndRecording(recordingID, c.userID)

			// Signal the room to stop MediaRecorder and upload
			c.hub.broadcast <- &Message{
				Type:   "recording_stopped",
				RoomID: c.roomID,
				Payload: map[string]interface{}{
					"recordingId":         recordingID,
					"stoppedBy":           c.userID,
					"stoppedByPrivileged": stoppedByPrivileged,
					"message":             "Recording has been stopped",
				},
			}
			log.Printf("Recording %s stopped by %s in room %s (privileged=%v)",
				recordingID, c.userID, c.roomID, stoppedByPrivileged)

		default:
			log.Printf("Unknown message type: %s", msg.Type)
		}
	}
}

// ServeUploadRecording - HTTP endpoint nhận file upload từ browser sau khi ghi xong
func (h *Hub) ServeUploadRecording(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Auth
	cookie, err := r.Cookie("accessToken")
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	_, err = h.authClient.ValidateToken(cookie.Value)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	recordingID := r.URL.Query().Get("recordingId")
	if recordingID == "" {
		http.Error(w, "recordingId is required", http.StatusBadRequest)
		return
	}

	// Read upload (max 500MB)
	r.Body = http.MaxBytesReader(w, r.Body, 500<<20)
	data, err := io.ReadAll(r.Body)
	if err != nil {
		log.Printf("Failed to read recording upload: %v", err)
		http.Error(w, "Failed to read body", http.StatusBadRequest)
		return
	}

	mimeType := r.Header.Get("Content-Type")
	if mimeType == "" {
		mimeType = "video/webm"
	}

	rec, err := h.recordingService.FinishRecording(recordingID, data, mimeType)
	if err != nil {
		log.Printf("FinishRecording error: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":     true,
		"recordingId": rec.ID.String(),
		"fileUrl":     rec.FileURL,
		"fileSizeKB":  rec.FileSizeKB,
	})
}

// ServeLiveKitWebhook handles events from LiveKit server
func (h *Hub) ServeLiveKitWebhook(w http.ResponseWriter, r *http.Request) {
	if h.recordingService == nil {
		http.Error(w, "Service not available", http.StatusServiceUnavailable)
		return
	}

	// In production, you should verify the webhook signature here
	// using lksdk.UnmarshalWebhookEvent(r)

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read body", http.StatusBadRequest)
		return
	}

	var event map[string]interface{}
	if err := json.Unmarshal(body, &event); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if err := h.recordingService.HandleLiveKitWebhook(event); err != nil {
		log.Printf("Error handling LiveKit webhook: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (c *Client) writePump() {
	defer c.conn.Close()

	for message := range c.send {
		if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
			log.Printf("Failed to write message: %v", err)
			return
		}
	}
}

func (h *Hub) ServeWS(w http.ResponseWriter, r *http.Request) {
	// Extract token from Query Param or Cookie
	cookie, err := r.Cookie("accessToken")
	if err != nil {
		log.Printf("❌ No cookie found: %v", err)
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	token := cookie.Value

	// Validate token via RabbitMQ
	user, err := h.authClient.ValidateToken(token)
	if err != nil {
		log.Printf("Token validation failed: %v", err)
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	log.Printf("User authenticated: %s (%s)", user.Name, user.ID)

	// Upgrade connection
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Failed to upgrade connection: %v", err)
		return
	}

	client := &Client{
		conn:     conn,
		send:     make(chan []byte, 256),
		hub:      h,
		userID:   user.ID,
		userName: user.Name,
		roomID:   "", // Will be set when joining room
	}

	h.register <- client

	// Start goroutines
	go client.writePump()
	go client.readPump()

	log.Printf("WebSocket connection established for user %s", user.ID)
}
