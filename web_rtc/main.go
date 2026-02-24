package main

import (
	"flag"
	"log"
	"net/http"
	"os"
	"web_rtc/pkg/handler"
	"web_rtc/pkg/livekit"
	"web_rtc/pkg/mq"
	"web_rtc/pkg/rabbitmq"
	"web_rtc/pkg/service"
	"web_rtc/pkg/storage"
	ws "web_rtc/pkg/websocket"

	"web_rtc/pkg/database"

	"github.com/joho/godotenv"
)

var (
	rm         *livekit.RoomManager
	mqClient   mq.EventPublisher
	authClient *rabbitmq.AuthClient
	wsHub      *ws.Hub
)

func main() {
	mockFlag := flag.Bool("mock", false, "Run in mock mode without RabbitMQ")
	flag.Parse()

	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Database Setup
	database.InitDB()
	database.InitRedis()

	// RabbitMQ Setup
	rabbitURL := os.Getenv("RABBITMQ_URL")
	if rabbitURL == "" {
		rabbitURL = "amqp://guest:guest@localhost:5672/"
	}

	if *mockFlag {
		log.Println("Running in MOCK mode. RabbitMQ events will be logged but not published.")
		mqClient = mq.NewMockClient()
	} else {
		var client *mq.RabbitMQClient
		client, err = mq.NewRabbitMQClient(rabbitURL, "room_events")
		if err != nil {
			log.Fatalf("Failed to connect to RabbitMQ: %v", err)
		}
		mqClient = client
	}
	defer mqClient.Close()

	// LiveKit Setup
	liveKitHost := os.Getenv("LIVEKIT_URL")
	liveKitKey := os.Getenv("LIVEKIT_API_KEY")
	liveKitSecret := os.Getenv("LIVEKIT_API_SECRET")

	if liveKitHost == "" || liveKitKey == "" || liveKitSecret == "" {
		log.Println("Warning: LiveKit credentials not fully set. Token generation might fail.")
	}

	rm = livekit.NewRoomManager(liveKitHost, liveKitKey, liveKitSecret)

	// RabbitMQ Auth Client Setup (using rabbitURL)
	authClient, err = rabbitmq.NewAuthClient(rabbitURL)
	if err != nil {
		log.Fatalf("Failed to create auth client: %v", err)
	}
	defer authClient.Close()
	log.Println("RabbitMQ auth client connected successfully")

	// RPC Client Setup
	rpcClient, err := rabbitmq.NewRPCClient(rabbitURL)
	if err != nil {
		log.Printf("Failed to create RPC client: %v", err)
	} else {
		defer rpcClient.Close()
	}

	// MinIO Setup
	if err := storage.InitMinio(); err != nil {
		log.Printf("Warning: MinIO init failed (recording disabled): %v", err)
	}

	// Service Setup
	videoChatService := service.NewVideoChatService(database.GetDB(), rpcClient, mqClient, database.GetRedis(), rm)

	// Consumer Setup
	if !*mockFlag {
		consumer, err := handler.NewVideoChatConsumer(rabbitURL, videoChatService)
		if err != nil {
			log.Printf("Failed to create consumer: %v", err)
		} else {
			consumer.Start()
			defer consumer.Close()
		}
	}

	// WebSocket Hub Setup
	wsHub = ws.NewHub(authClient, mqClient, videoChatService, rm)

	videoChatService.OnSummaryChunk = func(roomID string, chunk string) {
		wsHub.BroadcastToRoomExcept(&ws.Message{
			Type:   "ai_summary_chunk",
			RoomID: roomID,
			Payload: map[string]interface{}{
				"chunk": chunk,
			},
		}, "")
	}

	videoChatService.OnSummaryComplete = func(roomID string) {
		wsHub.BroadcastToRoomExcept(&ws.Message{
			Type:   "ai_summary_complete",
			RoomID: roomID,
		}, "")
	}

	go wsHub.Run()
	log.Println("WebSocket hub started")

	// HTTP Server
	mux := http.NewServeMux()
	mux.HandleFunc("/ws", wsHub.ServeWS)                            // WebSocket endpoint
	mux.HandleFunc("/upload-recording", wsHub.ServeUploadRecording) // Recording upload
	mux.HandleFunc("/livekit/webhook", wsHub.ServeLiveKitWebhook)   // LiveKit Webhook

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, enableCORS(mux)))
}

func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		// Tuyệt đối không dùng "*" nếu muốn dùng withCredentials
		if origin != "" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		}

		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, Cookie")
		w.Header().Set("Access-Control-Allow-Credentials", "true") // QUAN TRỌNG

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
