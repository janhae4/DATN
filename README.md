# Collaborative Meeting Platform with AI Summarization

A comprehensive platform for real-time meetings, video chat, and automated AI summary generation.

## 🚀 Project Structure

The project is organized into several key modules:

- **Frontend**: A modern web interface built with Next.js and React.
- **Backend**: Core microservices managing data, teams, and integration logic (NestJS).
- **WebRTC Service**: High-performance signaling and media management service built in Go.
- **ML/AI Logic**: Python-based services for transcript processing and summary generation using Gemini API.

## 🛠️ Tech Stack

- **Frontend**: React, Next.js, Tailwind CSS.
- **Backend Services**: Node.js, NestJS, Go, Python.
- **Databases**: PostgreSQL, MongoDB, Redis.
- **Infrastucture**: Docker, RabbitMQ, MinIO, Meilisearch.
- **Communication**: gRPC, WebSocket, RabbitMQ.

## 🏁 Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js (v18+)
- Go (1.21+)
- Python (3.10+)

### Setup

1.  **Environment Variables**:
    Clone `.env.example` to `.env` in the root and relevant subdirectories.

2.  **Infrastructure**:
    Start the core services using Docker Compose:
    ```bash
    docker-compose up -d
    ```

3.  **Documentation**:
    - [MinIO Webhook Setup](./docs/minio-setup.md)
    - Additional documentation can be found in the respective module folders.

## 📝 License

This project is developed as part of a graduation thesis (DATN).
