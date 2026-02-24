package mq

import (
	"context"
	"encoding/json"
	"log"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

type RabbitMQClient struct {
	conn    *amqp.Connection
	channel *amqp.Channel
	queue   amqp.Queue
}

func NewRabbitMQClient(url string, queueName string) (*RabbitMQClient, error) {
	conn, err := amqp.Dial(url)
	if err != nil {
		return nil, err
	}

	ch, err := conn.Channel()
	if err != nil {
		return nil, err
	}

	q, err := ch.QueueDeclare(
		queueName, // name
		true,      // durable
		false,     // delete when unused
		false,     // exclusive
		false,     // no-wait
		nil,       // arguments
	)
	if err != nil {
		return nil, err
	}

	return &RabbitMQClient{
		conn:    conn,
		channel: ch,
		queue:   q,
	}, nil
}

func (c *RabbitMQClient) PublishEvent(event interface{}) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	body, err := json.Marshal(event)
	if err != nil {
		return err
	}

	err = c.channel.PublishWithContext(ctx,
		"",           // exchange
		c.queue.Name, // routing key
		false,        // mandatory
		false,        // immediate
		amqp.Publishing{
			ContentType: "application/json",
			Body:        body,
		})
	if err != nil {
		log.Printf("Failed to publish a message: %v", err)
		return err
	}
	log.Printf(" [x] Sent %s", body)
	return nil
}

func (c *RabbitMQClient) PublishToExchange(exchange, routingKey string, event interface{}) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	body, err := json.Marshal(event)
	if err != nil {
		return err
	}

	err = c.channel.PublishWithContext(ctx,
		exchange,   // exchange
		routingKey, // routing key
		false,      // mandatory
		false,      // immediate
		amqp.Publishing{
			ContentType: "application/json",
			Body:        body,
		})
	if err != nil {
		log.Printf("Failed to publish a message to exchange %s: %v", exchange, err)
		return err
	}
	log.Printf(" [x] Sent to %s/%s: %s", exchange, routingKey, body)
	return nil
}

func (c *RabbitMQClient) Close() {
	c.channel.Close()
	c.conn.Close()
}

type EventPublisher interface {
	PublishEvent(event interface{}) error
	PublishToExchange(exchange, routingKey string, event interface{}) error
	Close()
}

type MockClient struct{}

func NewMockClient() *MockClient {
	return &MockClient{}
}

func (c *MockClient) PublishEvent(event interface{}) error {
	log.Printf(" [Mock] Message published: %v", event)
	return nil
}

func (c *MockClient) PublishToExchange(exchange, routingKey string, event interface{}) error {
	log.Printf(" [Mock] Message published to %s/%s: %v", exchange, routingKey, event)
	return nil
}

func (c *MockClient) Close() {}
