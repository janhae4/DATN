@echo off
@REM echo ========================================================
@REM echo [PHASE 1] KHOI DONG HA TANG (DB, RabbitMQ, Ollama...)
@REM echo Khong can build, chi can start container
@REM echo ========================================================
@REM docker compose up -d rabbitmq redis postgres pgadmin meili-search chroma ollama minio mongo_db mongo_rs_init mongo-express

@REM echo.
@REM echo ========================================================
@REM echo [PHASE 2] BUILD & CHAY PYTHON CHATBOT + FRONTEND
@REM echo ========================================================
@REM docker compose up -d --build chatbot frontend

@REM echo.
@REM echo ========================================================
@REM echo [PHASE 3] BUILD BACKEND CORE (Auth, Gateway, User...)
@REM echo ========================================================
@REM docker compose up -d --build api_gateway auth_service user_service redis_service

@REM echo.
@REM echo ========================================================
@REM echo [PHASE 4] BUILD QUAN LY DU AN (Project, Task, Sprint...)
@REM echo ========================================================
@REM docker compose up -d --build project_service task_service sprint_service epic_service label_service list_service

echo.
echo ========================================================
echo [PHASE 5] BUILD CAC SERVICE CON LAI (Communication...)
echo ========================================================
docker compose up -d --build ai_discussion_service team_service socket_service notification_service calendar_service gmail_service file_service

echo.
echo ========================================================
echo [HOAN TAT] HE THONG DA DUOC KHOI DONG TOAN BO!
echo ========================================================
pause