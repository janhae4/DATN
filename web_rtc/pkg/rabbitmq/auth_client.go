package rabbitmq

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
	amqp "github.com/rabbitmq/amqp091-go"
)

type AuthClient struct {
	conn      *amqp.Connection
	channel   *amqp.Channel
	queue     amqp.Queue
	responses map[string]chan []byte
	mu        sync.Mutex
}

type JwtDto struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
}

type ValidateTokenRequest struct {
	Token string `json:"token"`
}

func NewAuthClient(rabbitURL string) (*AuthClient, error) {
	conn, err := amqp.Dial(rabbitURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to RabbitMQ: %w", err)
	}

	channel, err := conn.Channel()
	if err != nil {
		conn.Close()
		return nil, fmt.Errorf("failed to open channel: %w", err)
	}

	queue, err := channel.QueueDeclare(
		"",
		false,
		true,
		true,
		false,
		nil,
	)
	if err != nil {
		channel.Close()
		conn.Close()
		return nil, fmt.Errorf("failed to declare queue: %w", err)
	}

	client := &AuthClient{
		conn:      conn,
		channel:   channel,
		queue:     queue,
		responses: make(map[string]chan []byte),
	}

	msgs, err := channel.Consume(
		queue.Name,
		"",
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		channel.Close()
		conn.Close()
		return nil, fmt.Errorf("failed to register consumer: %w", err)
	}

	go func() {
		for d := range msgs {
			client.mu.Lock()
			ch, ok := client.responses[d.CorrelationId]
			client.mu.Unlock()
			if ok {
				ch <- d.Body
			} else {
				log.Printf("Received response with unknown CorrelationId: %s", d.CorrelationId)
			}
		}
	}()

	return client, nil
}

func (c *AuthClient) ValidateToken(token string) (*JwtDto, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	corrID := uuid.New().String()

	payload, err := json.Marshal(ValidateTokenRequest{Token: token})
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	respCh := make(chan []byte, 1)
	c.mu.Lock()
	c.responses[corrID] = respCh
	c.mu.Unlock()

	defer func() {
		c.mu.Lock()
		delete(c.responses, corrID)
		c.mu.Unlock()
	}()

	err = c.channel.PublishWithContext(
		ctx,
		"auth_exchange",
		"auth.validateToken",
		false,
		false,
		amqp.Publishing{
			ContentType:   "application/json",
			CorrelationId: corrID,
			ReplyTo:       c.queue.Name,
			Body:          payload,
		},
	)
	if err != nil {
		return nil, fmt.Errorf("failed to publish request: %w", err)
	}

	log.Printf("Sent token validation request with correlation ID: %s", corrID)

	select {
	case body := <-respCh:
		var user JwtDto
		if err := json.Unmarshal(body, &user); err != nil {
			return nil, fmt.Errorf("failed to unmarshal response: %w", err)
		}
		log.Printf("Token validated successfully for user: %s", user.ID)
		return &user, nil
	case <-ctx.Done():
		return nil, fmt.Errorf("timeout waiting for auth response")
	}
}

func (c *AuthClient) Close() error {
	if c.channel != nil {
		c.channel.Close()
	}
	if c.conn != nil {
		return c.conn.Close()
	}
	return nil
}
