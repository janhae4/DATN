package database

import (
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"web_rtc/pkg/models"
)

var DB *gorm.DB

func InitDB() {
	dsn := os.Getenv("DATABASE_VIDEO_CHAT_URL")
	if dsn == "" {
		dsn = "host=localhost user=postgres password=postgres dbname=video_chat_db port=5432 sslmode=disable TimeZone=Asia/Ho_Chi_Minh"
	}

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	log.Println("Database connected successfully")

	// AutoMigrate – tự động tạo/cập nhật schema
	if err := DB.AutoMigrate(
		&models.Call{},
		&models.CallParticipant{},
		&models.CallTranscript{},
		&models.CallSummaryBlock{},
		&models.CallActionItem{},
		&models.CallRecording{},
	); err != nil {
		log.Printf("⚠️  AutoMigrate warning: %v", err)
	} else {
		log.Println("✅ Database schema up-to-date")
	}
}

func GetDB() *gorm.DB {
	return DB
}
