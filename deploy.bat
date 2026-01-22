@echo off
docker compose up -d rabbitmq redis postgres pgadmin meili-search chroma ollama minio mongo_db mongo_rs_init mongo-express

docker compose up -d --build chatbot frontend

docker compose up -d --build api_gateway auth_service user_service

docker compose up -d --build project_service task_service sprint_service epic_service label_service list_service

docker compose up -d --build ai_discussion_service team_service socket_service notification_service calendar_service gmail_service file_service

echo.
echo ========================================================
echo [HOAN TAT] HE THONG DA DUOC KHOI DONG TOAN BO!
echo ========================================================
pause