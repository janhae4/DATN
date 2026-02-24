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

type RPCClient struct {
	conn      *amqp.Connection
	channel   *amqp.Channel
	queue     amqp.Queue
	responses map[string]chan []byte
	mu        sync.Mutex
}

func NewRPCClient(url string) (*RPCClient, error) {
	conn, err := amqp.Dial(url)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to RabbitMQ: %w", err)
	}

	ch, err := conn.Channel()
	if err != nil {
		conn.Close()
		return nil, fmt.Errorf("failed to open channel: %w", err)
	}

	// Declare a temporary exclusive queue for replies
	q, err := ch.QueueDeclare(
		"",    // name (empty = auto-generated)
		false, // durable
		true,  // delete when unused
		true,  // exclusive
		false, // no-wait
		nil,   // arguments
	)
	if err != nil {
		ch.Close()
		conn.Close()
		return nil, fmt.Errorf("failed to declare reply queue: %w", err)
	}

	client := &RPCClient{
		conn:      conn,
		channel:   ch,
		queue:     q,
		responses: make(map[string]chan []byte),
	}

	// Start consuming from reply queue
	msgs, err := ch.Consume(
		q.Name, // queue
		"",     // consumer
		true,   // auto-ack
		false,  // exclusive
		false,  // no-local
		false,  // no-wait
		nil,    // args
	)
	if err != nil {
		ch.Close()
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
				log.Printf("Received RPC response with unknown CorrelationId: %s", d.CorrelationId)
			}
		}
	}()

	return client, nil
}

func (c *RPCClient) Call(exchange, routingKey string, payload interface{}, response interface{}) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second) // 10s timeout
	defer cancel()

	corrID := uuid.New().String()

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
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

	err = c.channel.PublishWithContext(
		ctx,
		exchange,   // exchange
		routingKey, // routing key
		false,      // mandatory
		false,      // immediate
		amqp.Publishing{
			ContentType:   "application/json",
			CorrelationId: corrID,
			ReplyTo:       c.queue.Name,
			Body:          body,
		},
	)
	if err != nil {
		return fmt.Errorf("failed to publish request: %w", err)
	}

	select {
	case respBody := <-respCh:
		if response != nil {
			if err := json.Unmarshal(respBody, response); err != nil {
				return fmt.Errorf("failed to unmarshal response: %w", err)
			}
		}
		return nil
	case <-ctx.Done():
		return fmt.Errorf("timeout waiting for RPC response")
	}
}

func (c *RPCClient) Close() {
	c.channel.Close()
	c.conn.Close()
}
