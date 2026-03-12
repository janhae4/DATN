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

# 4. Lấy thông tin Cloudflare Tunnel Token
read -p "Nhập Cloudflare Tunnel Token (Lấy từ Zero Trust Dashboard): " CF_TOKEN

echo ""
echo "--- Đang tạo các file .env ---"

# --- Tạo file ./backend/.env.dev ---
cat <<EOT > ./backend/.env.dev
NODE_ENV=production
VPS_IP=$VPS_IP
# Các biến dùng chung cho Backend
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/postgres
DATABASE_USER_URL="postgresql://postgres:postgres@postgres:5432/user"
DATABASE_NOTIFICATION_URL="postgresql://postgres:postgres@postgres:5432/notification"
DATABASE_TASK_URL="postgresql://postgres:postgres@postgres:5432/task"
DATABASE_TEAM_URL="postgresql://postgres:postgres@postgres:5432/team"
DATABASE_VIDEO_CHAT_URL="postgresql://postgres:postgres@postgres:5432/call"

DATABASE_CHATBOT_URL="mongodb://mongo_db:27017/chatbot?replicaSet=rs0&directConnection=true"
DATABASE_DISCUSSION_URL="mongodb://mongo_db:27017/discussion?replicaSet=rs0&directConnection=true"
DATABASE_FILE_URL="mongodb://mongo_db:27017/file?replicaSet=rs0&directConnection=true"

DATABASE_SPRINT_URL="postgres://postgres:postgres@postgres:5432/sprint_db"
DATABASE_LIST_URL="postgres://postgres:postgres@postgres:5432/list_db"
DATABASE_EPIC_URL="postgres://postgres:postgres@postgres:5432/epic_db"
DATABASE_LABEL_URL="postgres://postgres:postgres@postgres:5432/label_db"
DATABASE_PROJECT_URL="postgres://postgres:postgres@postgres:5432/project_db"

REDIS_CLIENT_HOST=redis
REDIS_CLIENT_PORT=6379
RMQ_URL=amqp://guest:guest@rabbitmq:5672/
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
# AI Config
GEMINI_API_KEY=$AI_API_KEY

GOOGLE_CLIENT_ID=324234234234-example.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-example
GOOGLE_CALLBACK_URL=https://$VPS_IP/api/auth/google/callback
JWT_ACCESS_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_key
SMTP_TRANSPORT=smtps://user:pass@smtp.gmail.com
SMTP_FROM="Taskora <noreply@gmail.com>"
EOT
echo "[OK] Đã tạo ./backend/.env.dev"

# --- Tạo file ./web_rtc/.env ---
cat <<EOT > ./web_rtc/.env
PORT=8005
LIVEKIT_URL=http://livekit:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=$LK_SECRET
DATABASE_VIDEO_CHAT_URL=postgresql://postgres:postgres@postgres:5432/call
RMQ_URL=amqp://guest:guest@rabbitmq:5672/
EOT
echo "[OK] Đã tạo ./web_rtc/.env"

# --- Tạo file ./python/chatbot-service/chatbot.env ---
# Giữ nguyên các biến cũ, chỉ cập nhật API Key nếu có nhập
cat <<EOT > ./python/chatbot-service/chatbot.env
RMQ_URL=amqp://guest:guest@rabbitmq:5672/
CHROMA_HOST=chroma
CHROMA_PORT=8000
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
GEMINI_API_KEY=$AI_API_KEY
EOT
echo "[OK] Đã tạo ./python/chatbot-service/chatbot.env"

# --- Tạo file ./frontend/.env ---
cat <<EOT > ./frontend/.env
PORT=5000
NEXT_PUBLIC_API_URL=http://$VPS_IP:3000
NEXT_PUBLIC_SOCKET_URL=ws://$VPS_IP:4001
NEXT_PUBLIC_WEBRTC_WS_URL=ws://$VPS_IP:8005/ws
NEXT_PUBLIC_LIVEKIT_URL=http://$VPS_IP:7880
NEXT_PUBLIC_MINIO_URL=http://$VPS_IP:9000
INTERNAL_API_URL=http://api_gateway:3000
EOT
echo "[OK] Đã tạo ./frontend/.env"

# --- Tạo file .env gốc (cho Docker Compose) ---
cat <<EOT > .env
VPS_IP=$VPS_IP
NEXT_PUBLIC_API_URL=https://api.$VPS_IP
NEXT_PUBLIC_SOCKET_URL=wss://socket.$VPS_IP
NEXT_PUBLIC_WEBRTC_WS_URL=wss://webrtc.$VPS_IP
NEXT_PUBLIC_LIVEKIT_URL=https://livekit.$VPS_IP
NEXT_PUBLIC_MINIO_URL=https://minio.$VPS_IP
CLOUDFLARE_TUNNEL_TOKEN=$CF_TOKEN
EOT
echo "[OK] Đã tạo file .env gốc"

echo "==========================================="
echo "   THÀNH CÔNG! Chạy 'docker compose up -d'   "
echo "==========================================="
