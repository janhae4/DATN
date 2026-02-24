package handler

import (
	"encoding/json"
	"log"
	"strings"

	"web_rtc/pkg/service"

	"github.com/google/uuid"
	amqp "github.com/rabbitmq/amqp091-go"
)

type VideoChatConsumer struct {
	conn    *amqp.Connection
	channel *amqp.Channel
	service *service.VideoChatService
}

func NewVideoChatConsumer(url string, service *service.VideoChatService) (*VideoChatConsumer, error) {
	conn, err := amqp.Dial(url)
	if err != nil {
		return nil, err
	}

	ch, err := conn.Channel()
	if err != nil {
		return nil, err
	}

	return &VideoChatConsumer{
		conn:    conn,
		channel: ch,
		service: service,
	}, nil
}

const ExchangeName = "video_chat_exchange"

func (c *VideoChatConsumer) Start() {
	err := c.channel.ExchangeDeclare(
		ExchangeName, // name
		"direct",     // type
		true,         // durable
		false,        // auto-deleted
		false,        // internal
		false,        // no-wait
		nil,          // arguments
	)
	if err != nil {
		log.Printf("Failed to declare exchange %s: %v", ExchangeName, err)
		return
	}

	// Queues from VideoChatController
	// Map key is both QueueName and RoutingKey
	queues := map[string]func([]byte) (interface{}, error){
		"video_chat.call.create": func(d []byte) (interface{}, error) {
			var payload struct {
				UserID         string  `json:"userId"`
				TeamID         string  `json:"teamId"`
				RefID          *string `json:"refId"`
				RefType        *string `json:"refType"`
				Password       string  `json:"password"`
				IsLobbyEnabled bool    `json:"isLobbyEnabled"`
			}
			if err := json.Unmarshal(d, &payload); err != nil {
				return nil, err
			}
			return c.service.CreateOrJoinCall(payload.UserID, payload.TeamID, payload.RefID, payload.RefType, payload.Password, payload.IsLobbyEnabled)
		},
		"video_chat.get": func(d []byte) (interface{}, error) {
			var payload struct {
				RoomID string `json:"roomId"`
				UserID string `json:"userId"`
			}
			if err := json.Unmarshal(d, &payload); err != nil {
				return nil, err
			}
			return c.service.GetCallInfo(payload.RoomID, payload.UserID)
		},
		"video_chat.history.get": func(d []byte) (interface{}, error) {
			var userID string
			// Try as string directly (JSON string "uuid")
			if err := json.Unmarshal(d, &userID); err != nil {
				// Try as object wrapper { userId: "..." }
				var w struct {
					UserID string `json:"userId"`
				}
				if err2 := json.Unmarshal(d, &w); err2 == nil {
					userID = w.UserID
				} else {
					return nil, err
				}
			}
			return c.service.GetCallHistory(userID)
		},
		"video_chat.history.room.get": func(d []byte) (interface{}, error) {
			var roomID string
			if err := json.Unmarshal(d, &roomID); err != nil {
				var w struct {
					RoomID string `json:"roomId"`
				}
				if err2 := json.Unmarshal(d, &w); err2 == nil {
					roomID = w.RoomID
				} else {
					return nil, err
				}
			}
			return c.service.GetCallHistoryByRoomId(roomID)
		},
		"video_chat.history.team.get": func(d []byte) (interface{}, error) {
			var payload struct {
				TeamID string `json:"teamId"`
				UserID string `json:"userId"`
				Page   int    `json:"page"`
				Limit  int    `json:"limit"`
			}
			log.Println("video_chat.history.team.get", string(d))
			if err := json.Unmarshal(d, &payload); err != nil {
				return nil, err
			}
			if payload.Page <= 0 {
				payload.Page = 1
			}
			if payload.Limit <= 0 {
				payload.Limit = 10
			}
			return c.service.GetCallHistoryByTeamId(payload.TeamID, payload.UserID, payload.Page, payload.Limit)
		},
		"video_chat.action_items.get": func(d []byte) (interface{}, error) {
			var payload struct {
				CallID string `json:"callId"`
				Page   int    `json:"page"`
				Limit  int    `json:"limit"`
			}
			if err := json.Unmarshal(d, &payload); err != nil {
				return nil, err
			}
			if payload.Page <= 0 {
				payload.Page = 1
			}
			if payload.Limit <= 0 {
				payload.Limit = 10
			}
			id, _ := uuid.Parse(payload.CallID)
			return c.service.GetCallActionItems(id, payload.Page, payload.Limit)
		},
		"video_chat.recordings.get": func(d []byte) (interface{}, error) {
			var payload struct {
				CallID string `json:"callId"`
				Page   int    `json:"page"`
				Limit  int    `json:"limit"`
			}
			if err := json.Unmarshal(d, &payload); err != nil {
				return nil, err
			}
			if payload.Page <= 0 {
				payload.Page = 1
			}
			if payload.Limit <= 0 {
				payload.Limit = 10
			}
			id, _ := uuid.Parse(payload.CallID)
			return c.service.GetCallRecordings(id, payload.Page, payload.Limit)
		},
		"video_chat.transcripts.get": func(d []byte) (interface{}, error) {
			var payload struct {
				CallID string `json:"callId"`
				Page   int    `json:"page"`
				Limit  int    `json:"limit"`
			}
			if err := json.Unmarshal(d, &payload); err != nil {
				return nil, err
			}
			if payload.Page <= 0 {
				payload.Page = 1
			}
			if payload.Limit <= 0 {
				payload.Limit = 20
			}
			id, _ := uuid.Parse(payload.CallID)
			return c.service.GetCallTranscripts(id, payload.Page, payload.Limit)
		},
		"video_chat.user.kick": func(d []byte) (interface{}, error) {
			var payload struct {
				RequesterID  string `json:"requesterId"`
				TargetUserID string `json:"targetUserId"`
				RoomID       string `json:"roomId"`
			}
			if err := json.Unmarshal(d, &payload); err != nil {
				return nil, err
			}
			return c.service.KickUser(payload.RequesterID, payload.TargetUserID, payload.RoomID)
		},
		"video_chat.user.unkick": func(d []byte) (interface{}, error) {
			var payload struct {
				RequesterID  string `json:"requesterId"`
				TargetUserID string `json:"targetUserId"`
				RoomID       string `json:"roomId"`
			}
			if err := json.Unmarshal(d, &payload); err != nil {
				return nil, err
			}
			return c.service.UnKickUser(payload.RequesterID, payload.TargetUserID, payload.RoomID)
		},
		"video_chat.transcript.receive": func(d []byte) (interface{}, error) {
			var payload struct {
				RoomID   string `json:"roomId"`
				UserID   string `json:"userId"`
				UserName string `json:"userName"`
				Content  string `json:"content"`
			}
			if err := json.Unmarshal(d, &payload); err != nil {
				return nil, err
			}
			return nil, c.service.HandleTranscriptReceive(payload.RoomID, payload.UserID, payload.UserName, payload.Content)
		},
		"video_chat.transcript.process": func(d []byte) (interface{}, error) {
			var payload struct {
				RoomID string `json:"roomId"`
			}
			// Might be just string or object
			if err := json.Unmarshal(d, &payload); err != nil {
				// Try string
				var rid string
				if err2 := json.Unmarshal(d, &rid); err2 == nil {
					payload.RoomID = rid
				} else {
					return nil, err
				}
			}
			return nil, c.service.ProcessMeetingSummary(payload.RoomID)
		},
		"video_chat.room.leave": func(d []byte) (interface{}, error) {
			var payload struct {
				RoomID string `json:"roomId"`
				UserID string `json:"userId"`
			}
			if err := json.Unmarshal(d, &payload); err != nil {
				return nil, err
			}
			return nil, c.service.LeaveCall(payload.RoomID, payload.UserID)
		},
		"video_chat.action_item.update": func(d []byte) (interface{}, error) {
			var payload struct {
				ItemID string `json:"itemId"`
				// Other fields in data map
			}
			if err := json.Unmarshal(d, &payload); err != nil {
				return nil, err
			}
			var data map[string]interface{}
			json.Unmarshal(d, &data)
			delete(data, "itemId")

			id, _ := uuid.Parse(payload.ItemID)
			return nil, c.service.UpdateActionItem(id, data)
		},
		"video_chat.action_item.delete": func(d []byte) (interface{}, error) {
			var payload struct {
				ItemID string `json:"itemId"`
			}
			if err := json.Unmarshal(d, &payload); err != nil {
				return nil, err
			}
			id, _ := uuid.Parse(payload.ItemID)
			return nil, c.service.DeleteActionItem(id)
		},
		"video_chat.action_item.bulk_update": func(d []byte) (interface{}, error) {
			var payload struct {
				CallID string `json:"callId"`
				Status string `json:"status"`
			}
			if err := json.Unmarshal(d, &payload); err != nil {
				return nil, err
			}
			id, _ := uuid.Parse(payload.CallID)
			return nil, c.service.BulkUpdateActionItemsStatus(id, payload.Status)
		},
		"video_chat.action_item.bulk_delete": func(d []byte) (interface{}, error) {
			var payload struct {
				CallID string `json:"callId"`
			}
			if err := json.Unmarshal(d, &payload); err != nil {
				return nil, err
			}
			id, _ := uuid.Parse(payload.CallID)
			return nil, c.service.BulkDeleteActionItems(id)
		},
	}

	for qName, handler := range queues {
		go c.consumeQueue(qName, handler)
	}
}

func (c *VideoChatConsumer) consumeQueue(qName string, handler func([]byte) (interface{}, error)) {
	// Declare queue to ensure it exists
	_, err := c.channel.QueueDeclare(
		qName, // name
		true,  // durable
		false, // delete when unused
		false, // exclusive
		false, // no-wait
		nil,   // arguments
	)
	if err != nil {
		log.Printf("Failed to declare queue %s: %v", qName, err)
		return
	}

	// Bind queue to exchange
	err = c.channel.QueueBind(
		qName,        // queue name
		qName,        // routing key
		ExchangeName, // exchange
		false,
		nil,
	)
	if err != nil {
		log.Printf("Failed to bind queue %s to exchange %s: %v", qName, ExchangeName, err)
		// Continue anyway? Usually consume fails if bind fails? No, consume works on queue.
		// But if bind fails, messages won't arrive ideally.
		// However, maybe exchange doesn't exist?
		// We should declare exchange too?
		// Assuming exchange exists (created by other services or manually).
		// If not, we can declare it.
	}

	msgs, err := c.channel.Consume(
		qName, // queue
		"",    // consumer
		false, // auto-ack
		false, // exclusive
		false, // no-local
		false, // no-wait
		nil,   // args
	)
	if err != nil {
		log.Printf("Failed to register consumer for queue %s: %v", qName, err)
		return
	}

	log.Printf("Started consuming queue: %s", qName)

	for d := range msgs {
		response, err := handler(d.Body)

		if d.ReplyTo != "" {
			respBytes, _ := json.Marshal(response)
			if err != nil {
				// Return error object if handler failed
				status := 500
				errMsg := err.Error()
				if errMsg == "room not found" {
					status = 404
				} else if strings.Contains(errMsg, "permission denied") || strings.Contains(errMsg, "banned") {
					status = 403
				}
				errResp := map[string]interface{}{
					"error":      errMsg,
					"message":    errMsg,
					"status":     "error",
					"statusCode": status,
				}
				respBytes, _ = json.Marshal(errResp)
			} else if response == nil {
				// void response
				respBytes = []byte("null")
			}

			c.channel.Publish(
				"",        // exchange
				d.ReplyTo, // routing key
				false,     // mandatory
				false,     // immediate
				amqp.Publishing{
					ContentType:   "application/json",
					CorrelationId: d.CorrelationId,
					Body:          respBytes,
				},
			)
		}
		d.Ack(false)
	}
}

func (c *VideoChatConsumer) Close() {
	c.channel.Close()
	c.conn.Close()
}
