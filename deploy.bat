@echo off
echo ========================================================
echo [KHOI DONG] TAT CA CAC CONTAINER CUA HE THONG...
echo ========================================================

echo.
echo [1/5] Dang khoi dong ha tang (Databases, Redis, MQ)...
docker compose up -d rabbitmq redis postgres pgadmin mongo_db mongo-express meili-search chroma
docker compose up -d mongo_rs_init

echo.
echo [2/5] Dang khoi dong cac dich vu ho tro (Livekit, Minio, Ollama)...
docker compose up -d minio livekit livekit-egress ollama
docker compose up -d minio-setup

echo.
echo [3/5] Dang build va khoi dong Core Services (Auth, User, Project, Task)...
docker compose up -d --build api_gateway auth_service user_service team_service project_service task_service sprint_service epic_service label_service list_service

echo.
echo [4/5] Dang build va khoi dong Feature Services (Socket, Notification, AI, RTC)...
docker compose up -d --build socket_service notification_service calendar_service gmail_service file_service ai_discussion_service web_rtc_service chatbot

echo.
echo [5/5] Dang build va khoi dong Frontend...
docker compose up -d --build frontend

echo.
echo ========================================================
echo [HOAN TAT] HE THONG DA DUOC KHOI DONG TOAN BO!
echo.
echo - Frontend: http://localhost:5000
echo - API Gateway: http://localhost:3000
echo - RabbitMQ Management: http://localhost:15672
echo - PGAdmin: http://localhost:5050
echo - Mongo Express: http://localhost:8081
echo - Minio Console: http://localhost:9001
echo ========================================================
pause