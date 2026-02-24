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

// NewAuthClient creates a new RabbitMQ client for auth validation
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

	// Declare a temporary queue for receiving responses
	queue, err := channel.QueueDeclare(
		"",    // name (empty = auto-generated)
		false, // durable
		true,  // delete when unused
		true,  // exclusive
		false, // no-wait
		nil,   // arguments
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

	// Start consuming from reply queue immediately
	msgs, err := channel.Consume(
		queue.Name, // queue
		"",         // consumer
		true,       // auto-ack
		false,      // exclusive
		false,      // no-local
		false,      // no-wait
		nil,        // args
	)
	if err != nil {
		channel.Close()
		conn.Close()
		return nil, fmt.Errorf("failed to register consumer: %w", err)
	}

	// Background goroutine to handle responses
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

// ValidateToken validates a JWT token via RabbitMQ auth service
func (c *AuthClient) ValidateToken(token string) (*JwtDto, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Generate correlation ID
	corrID := uuid.New().String()

	// Prepare request payload
	payload, err := json.Marshal(ValidateTokenRequest{Token: token})
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	// Create response channel
	respCh := make(chan []byte, 1)
	c.mu.Lock()
	c.responses[corrID] = respCh
	c.mu.Unlock()

	defer func() {
		c.mu.Lock()
		delete(c.responses, corrID)
		c.mu.Unlock()
	}()

	// Publish request to auth exchange
	err = c.channel.PublishWithContext(
		ctx,
		"auth_exchange",       // exchange
		"auth.validateToken", // routing key
		false,                 // mandatory
		false,                 // immediate
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

	// Wait for response
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

// Close closes the RabbitMQ connection
func (c *AuthClient) Close() error {
	if c.channel != nil {
		c.channel.Close()
	}
	if c.conn != nil {
		return c.conn.Close()
	}
	return nil
}
