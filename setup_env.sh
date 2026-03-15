#!/bin/bash

echo "==========================================="
echo "   Taskora VPS Environment Setup Script    "
echo "==========================================="

# 1. VPS IP or Domain
read -p "Nhập IP hoặc Domain của VPS (mặc định: taskora-datn.site): " VPS_IP
if [ -z "$VPS_IP" ]; then VPS_IP="taskora-datn.site"; fi

# 2. AI API Key
read -p "Nhập Gemini/OpenAI API Key: " AI_API_KEY

# 3. Livekit Info
read -p "Nhập Livekit URL (mặc định: wss://datn-g2hljd9e.livekit.cloud): " LK_URL
if [ -z "$LK_URL" ]; then LK_URL="wss://datn-g2hljd9e.livekit.cloud"; fi

read -p "Nhập Livekit API Key (mặc định: devkey): " LK_KEY
if [ -z "$LK_KEY" ]; then LK_KEY="devkey"; fi

read -p "Nhập Livekit API Secret: " LK_SECRET

# 4. Cloudflare Tunnel Token
read -p "Nhập Cloudflare Tunnel Token: " CF_TOKEN

# 5. Google OAuth (Required for login)
read -p "Nhập Google Client ID: " GOOGLE_ID
read -p "Nhập Google Client Secret: " GOOGLE_SECRET

# 6. Email SMTP (Required for notifications)
read -p "Nhập SMTP Gmail User (ví dụ: abc@gmail.com): " SMTP_USER
read -p "Nhập SMTP Gmail App Password: " SMTP_PASS

echo ""
echo "--- Generating .env files ---"

# --- Backend Environment ---
cat <<EOT > ./backend/.env.dev
NODE_ENV=production
VPS_IP=$VPS_IP

# Database URLs
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

# Redis & RabbitMQ
REDIS_CLIENT_HOST=redis
REDIS_CLIENT_PORT=6379
RMQ_URL=amqp://guest:guest@rabbitmq:5672/

# Minio Config
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_EXTERNAL_URL=https://minio.$VPS_IP
MINIO_BUCKET=documents
MINIO_USE_SSL=false

# AI Config
GEMINI_API_KEY=$AI_API_KEY

# Auth & OAuth
GOOGLE_CLIENT_ID=$GOOGLE_ID
GOOGLE_CLIENT_SECRET=$GOOGLE_SECRET
GOOGLE_CALLBACK_URL=https://api.$VPS_IP/auth/google/callback
JWT_ACCESS_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "please-generate-a-random-32-char-hex-string")

# Email Config
SMTP_TRANSPORT=smtps://$SMTP_USER:$SMTP_PASS@smtp.gmail.com
SMTP_FROM='"NO REPLY" <$SMTP_USER>'
APP_NAME='Taskora'
SUPPORT_EMAIL=$SMTP_USER

# Other Configs
FRONT_END_URL=https://$VPS_IP
COOKIE_DOMAIN=.$VPS_IP
SEARCH_API_KEY=$(openssl rand -hex 16 2>/dev/null || echo "please-generate-a-random-16-char-hex-string")
SEARCH_HOST_URL=http://meilisearch:7700
EOT
echo "[OK] Generated ./backend/.env.dev"

# --- WebRTC Environment ---
cat <<EOT > ./web_rtc/.env
PORT=8005
LIVEKIT_URL=$LK_URL
LIVEKIT_API_KEY=$LK_KEY
LIVEKIT_API_SECRET=$LK_SECRET
DATABASE_VIDEO_CHAT_URL=postgresql://postgres:postgres@postgres:5432/call
RMQ_URL=amqp://guest:guest@rabbitmq:5672/
GEMINI_API_KEY=$AI_API_KEY
EOT
echo "[OK] Generated ./web_rtc/.env"

# --- Chatbot-Service Environment ---
cat <<EOT > ./python/chatbot-service/chatbot.env
RMQ_URL=amqp://guest:guest@rabbitmq:5672/
CHROMA_HOST=chroma
CHROMA_PORT=8000
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
GEMINI_API_KEY=$AI_API_KEY
EOT
echo "[OK] Generated ./python/chatbot-service/chatbot.env"

# --- Frontend Environment ---
cat <<EOT > ./frontend/.env
PORT=5000
NEXT_PUBLIC_API_URL=https://api.$VPS_IP
NEXT_PUBLIC_SOCKET_URL=wss://socket.$VPS_IP
NEXT_PUBLIC_WEBRTC_WS_URL=wss://webrtc.$VPS_IP/ws
NEXT_PUBLIC_LIVEKIT_URL=$LK_URL
NEXT_PUBLIC_MINIO_URL=https://minio.$VPS_IP
INTERNAL_API_URL=http://api_gateway:3000
EOT
echo "[OK] Generated ./frontend/.env"

# --- Root Environment (Docker Compose) ---
cat <<EOT > .env
VPS_IP=$VPS_IP
NEXT_PUBLIC_API_URL=https://api.$VPS_IP
NEXT_PUBLIC_SOCKET_URL=wss://socket.$VPS_IP
NEXT_PUBLIC_WEBRTC_WS_URL=wss://webrtc.$VPS_IP/ws
NEXT_PUBLIC_LIVEKIT_URL=$LK_URL
NEXT_PUBLIC_MINIO_URL=https://minio.$VPS_IP
CLOUDFLARE_TUNNEL_TOKEN=$CF_TOKEN
EOT
echo "[OK] Generated root .env file"

echo "==========================================="
echo "   SUCCESS! Now run 'docker compose up -d'   "
echo "==========================================="
