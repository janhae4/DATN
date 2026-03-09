# Collaborative Meeting Platform with AI Summarization

An Agile project management platform integrated with real-time video conferencing (WebRTC) and automated meeting summarization via AI. The system is built on a modern Microservices architecture to ensure scalability and high performance.

---

## Project Structure

The system is organized into the following main components:

- **Frontend (`/frontend`)**: A modern user interface built with **Next.js**, React, Tailwind CSS, and Framer Motion.
- **Backend (`/backend`)**: A microservices system built with **NestJS**, communicating via RabbitMQ and gRPC. It covers modules like Auth, User, Project, Task, Team, Calendar, Notification, and more.
- **WebRTC Service (`/web_rtc`)**: Handles real-time signaling and media transmission using **Go** and **LiveKit**.
- **AI Logic (`/python`)**: Worker services for natural language processing, meeting summarization, and a Chatbot using **Python** and Gemini API/Ollama.

---

## Prerequisites

To run the project, ensure you have the following installed:
- **Docker & Docker Compose** (Latest version recommended)
- **Node.js (v18+)** & npm
- **Go (1.21+)** (If running WebRTC locally)
- **Python (3.10+)** (If running AI workers locally)

---

## Quick Start with Docker Compose (Recommended)

Docker Compose is the easiest way to run the entire ecosystem (Databases, Message Broker, Microservices, and Frontend).

### 1. Environment Setup
Check and configure the necessary `.env` files:
- Root directory: `./docker-compose.yml` (environment variables are pre-configured in the file).
- Backend: `./backend/.env.dev` (Ensure DB and RabbitMQ configurations match docker-compose).
- Frontend: `./frontend/.env.local`.

### 2. Launch
From the root directory, run:
```bash
docker-compose up -d --build
```
*Note: The first build may take 5-10 minutes depending on your internet connection.*

### 3. Services & Ports
- **Frontend**: `http://localhost:5000`
- **API Gateway (Backend)**: `http://localhost:3000`
- **PGAdmin (Postgres Management)**: `http://localhost:5050` (Email: `admin@admin.com` | Pass: `root`)
- **MinIO Console (Storage)**: `http://localhost:9001` (User/Pass: `minioadmin`)
- **RabbitMQ Management**: `http://localhost:15672` (User/Pass: `guest`)
- **MeiliSearch**: `http://localhost:7700`

---

## Local Development Setup

If you want to modify code and see changes instantly (Hot reload), run the components locally.

### 1. Start Infrastructure
Use Docker to run only the databases and support tools:
```bash
docker-compose up -d postgres redis rabbitmq mongo_db minio chroma ollama meili-search livekit
```

### 2. Run Backend (NestJS Monorepo)
```bash
cd backend
npm install

# Run all essential microservices using concurrently
npm run start:all

# Or run individual services (e.g., API Gateway and Auth)
npm run start:dev:api-gateway
npm run start:dev:auth
```
*Check `backend/package.json` for all available start scripts.*

### 3. Run Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
Access at: `http://localhost:5000`

### 4. Run WebRTC Service (Go)
```bash
cd web_rtc
go run main.go
```

### 5. Run AI Workers (Python)
```bash
cd python/chatbot-service
# Create venv and install dependencies
python -m venv venv
source venv/bin/activate # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

---

## Additional Documentation
- **Swagger UI**: When the backend is running, visit `http://localhost:3000/api` for API documentation.
- **MinIO Setup**: Detailed guide for MinIO Webhook configuration at [docs/minio-setup.md](./docs/minio-setup.md).

---

## Project Info
This project was developed as part of a Graduation Thesis (DATN).
For any inquiries, please contact the development team.
