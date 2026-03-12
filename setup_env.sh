#!/bin/bash

echo "==========================================="
echo "   Taskora VPS Environment Setup Script    "
echo "==========================================="

# 1. Lấy thông tin IP hoặc Domain của VPS
read -p "Nhập IP hoặc Domain của VPS (ví dụ: 13.212.1.5): " VPS_IP
if [ -z "$VPS_IP" ]; then VPS_IP="127.0.0.1"; fi

# 2. Lấy thông tin AI API Key (nếu có)
read -p "Nhập Gemini/OpenAI API Key (bỏ qua nếu đã có trong chatbot.env): " AI_API_KEY

# 3. Lấy thông tin Livekit (nếu muốn đổi)
read -p "Nhập Livekit API Secret (mặc định: 4msnddOg...): " LK_SECRET
if [ -z "$LK_SECRET" ]; then LK_SECRET="4msnddOgHpRlhfN1P2uVM0akISxFJJPY"; fi

echo ""
echo "--- Đang tạo các file .env ---"

# --- Tạo file ./backend/.env.dev ---
cat <<EOT > ./backend/.env.dev
NODE_ENV=production
VPS_IP=$VPS_IP
# Các biến dùng chung cho Backend
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/postgres
REDIS_HOST=redis
REDIS_PORT=6379
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
# AI Config
GEMINI_API_KEY=$AI_API_KEY
EOT
echo "[OK] Đã tạo ./backend/.env.dev"

# --- Tạo file ./web_rtc/.env ---
cat <<EOT > ./web_rtc/.env
PORT=8005
LIVEKIT_URL=http://livekit:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=$LK_SECRET
DATABASE_VIDEO_CHAT_URL=postgresql://postgres:postgres@postgres:5432/call
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/
EOT
echo "[OK] Đã tạo ./web_rtc/.env"

# --- Tạo file ./python/chatbot-service/chatbot.env ---
# Giữ nguyên các biến cũ, chỉ cập nhật API Key nếu có nhập
cat <<EOT > ./python/chatbot-service/chatbot.env
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/
CHROMA_HOST=chroma
CHROMA_PORT=8000
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
GEMINI_API_KEY=$AI_API_KEY
EOT
echo "[OK] Đã tạo ./python/chatbot-service/chatbot.env"

# --- Tạo file .env gốc (cho Docker Compose) ---
cat <<EOT > .env
VPS_IP=$VPS_IP
NEXT_PUBLIC_API_URL=http://$VPS_IP:3001
NEXT_PUBLIC_SOCKET_URL=ws://$VPS_IP:4001
NEXT_PUBLIC_WEBRTC_WS_URL=ws://$VPS_IP:8005/ws
NEXT_PUBLIC_LIVEKIT_URL=http://$VPS_IP:7880
NEXT_PUBLIC_MINIO_URL=http://$VPS_IP:9000
EOT
echo "[OK] Đã tạo file .env gốc"

echo "==========================================="
echo "   THÀNH CÔNG! Chạy 'docker compose up -d'   "
echo "==========================================="
