package storage

import (
	"context"
	"fmt"
	"io"
	"log"
	"os"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type MinioClient struct {
	client     *minio.Client
	bucketName string
	publicURL  string
}

var defaultClient *MinioClient

func InitMinio() error {
	endpoint := os.Getenv("MINIO_ENDPOINT")
	if endpoint == "" {
		endpoint = os.Getenv("MINIO_ENDPOINT_INTERNAL")
	}
	if endpoint == "" {
		endpoint = "localhost:9000"
	}

	// Strip protocol if present (minio.New expects host:port)
	if len(endpoint) > 7 && endpoint[:7] == "http://" {
		endpoint = endpoint[7:]
	} else if len(endpoint) > 8 && endpoint[:8] == "https://" {
		endpoint = endpoint[8:]
	}

	accessKey := os.Getenv("MINIO_ACCESS_KEY")
	if accessKey == "" {
		accessKey = "minioadmin"
	}

	secretKey := os.Getenv("MINIO_SECRET_KEY")
	if secretKey == "" {
		secretKey = "minioadmin"
	}

	bucketName := os.Getenv("MINIO_RECORDING_BUCKET")
	if bucketName == "" {
		bucketName = "meeting-recordings"
	}

	publicURL := os.Getenv("MINIO_PUBLIC_URL")
	if publicURL == "" {
		publicURL = fmt.Sprintf("http://%s", endpoint)
	}

	useSSL := os.Getenv("MINIO_USE_SSL") == "true"

	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		return fmt.Errorf("failed to create minio client: %w", err)
	}

	ctx := context.Background()

	// Create bucket if not exists
	exists, err := client.BucketExists(ctx, bucketName)
	if err != nil {
		return fmt.Errorf("failed to check bucket existence: %w", err)
	}

	if !exists {
		if err := client.MakeBucket(ctx, bucketName, minio.MakeBucketOptions{}); err != nil {
			return fmt.Errorf("failed to create bucket: %w", err)
		}

		// Set bucket policy to public read
		policy := fmt.Sprintf(`{
			"Version": "2012-10-17",
			"Statement": [{
				"Effect": "Allow",
				"Principal": {"AWS": ["*"]},
				"Action": ["s3:GetObject"],
				"Resource": ["arn:aws:s3:::%s/*"]
			}]
		}`, bucketName)
		if err := client.SetBucketPolicy(ctx, bucketName, policy); err != nil {
			log.Printf("Warning: failed to set bucket policy: %v", err)
		}

		log.Printf("✅ MinIO bucket '%s' created", bucketName)
	}

	defaultClient = &MinioClient{
		client:     client,
		bucketName: bucketName,
		publicURL:  publicURL,
	}

	log.Printf("✅ MinIO connected at %s, bucket: %s", endpoint, bucketName)
	return nil
}

func GetMinio() *MinioClient {
	return defaultClient
}

// UploadRecording uploads a webm recording to MinIO and returns the public URL
func (m *MinioClient) UploadRecording(ctx context.Context, objectName string, reader io.Reader, size int64, contentType string) (string, error) {
	if contentType == "" {
		contentType = "video/webm"
	}

	info, err := m.client.PutObject(ctx, m.bucketName, objectName, reader, size, minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload recording: %w", err)
	}

	log.Printf("✅ Recording uploaded: %s (%.2f KB)", objectName, float64(info.Size)/1024)

	fileURL := fmt.Sprintf("%s/%s/%s", m.publicURL, m.bucketName, objectName)
	return fileURL, nil
}
