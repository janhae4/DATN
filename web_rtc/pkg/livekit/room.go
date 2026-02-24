package livekit

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/livekit/protocol/auth"
	"github.com/livekit/protocol/livekit"
	lksdk "github.com/livekit/server-sdk-go/v2"
)

type RoomManager struct {
	apiKey       string
	apiSecret    string
	host         string
	egressClient *lksdk.EgressClient
}

func NewRoomManager(host, apiKey, apiSecret string) *RoomManager {
	egressClient := lksdk.NewEgressClient(host, apiKey, apiSecret)
	return &RoomManager{
		host:         host,
		apiKey:       apiKey,
		apiSecret:    apiSecret,
		egressClient: egressClient,
	}
}

func (rm *RoomManager) GetJoinToken(roomName, identity, name string) (string, error) {
	at := auth.NewAccessToken(rm.apiKey, rm.apiSecret)
	grant := &auth.VideoGrant{
		RoomJoin: true,
		Room:     roomName,
	}
	at.AddGrant(grant).
		SetIdentity(identity).
		SetName(name).
		SetValidFor(time.Hour)

	return at.ToJWT()
}

func (rm *RoomManager) StartRoomRecording(roomName string, filepath string) (string, error) {
	ctx := context.Background()

	// Configuration for MinIO (Egress service runs in Docker, so use service name)
	minioEndpoint := os.Getenv("MINIO_ENDPOINT_INTERNAL")
	if minioEndpoint == "" {
		minioEndpoint = "http://minio:9000"
	}
	bucketName := os.Getenv("MINIO_RECORDING_BUCKET")
	if bucketName == "" {
		bucketName = "meeting-recordings"
	}

	if filepath == "" {
		timestamp := time.Now().Format("20060102_150405")
		filepath = fmt.Sprintf("%s/%s.mp4", roomName, timestamp)
	}

	log.Printf("📹 Starting LiveKit Egress for room: %s, path: %s", roomName, filepath)
	log.Printf("📦 MinIO Egress Upload Config - Endpoint: %s, Bucket: %s", minioEndpoint, bucketName)

	request := &livekit.RoomCompositeEgressRequest{
		RoomName: roomName,
		Layout:   "grid",
		Output: &livekit.RoomCompositeEgressRequest_File{
			File: &livekit.EncodedFileOutput{
				Filepath: filepath,
				Output: &livekit.EncodedFileOutput_S3{
					S3: &livekit.S3Upload{
						AccessKey:      os.Getenv("MINIO_ACCESS_KEY"),
						Secret:         os.Getenv("MINIO_SECRET_KEY"),
						Bucket:         bucketName,
						Endpoint:       minioEndpoint,
						Region:         "us-east-1",
						ForcePathStyle: true,
					},
				},
			},
		},
	}

	res, err := rm.egressClient.StartRoomCompositeEgress(ctx, request)
	if err != nil {
		return "", err
	}

	return res.EgressId, nil
}

func (rm *RoomManager) StopRoomRecording(egressId string) error {
	ctx := context.Background()
	_, err := rm.egressClient.StopEgress(ctx, &livekit.StopEgressRequest{
		EgressId: egressId,
	})
	return err
}
