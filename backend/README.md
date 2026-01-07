# DATN Backend - Microservices Architecture

This is the backend core of the DATN Project Management System, built with **NestJS** and following a microservices architecture for scalability and maintainability.

## 🏗 Architecture
The system is composed of multiple specialized services communicating via **RabbitMQ** (Message Broker) and **Redis** (Real-time/Cache). An **API Gateway** acts as the entry point for all client requests.

### Core Services
- **api-gateway**: The main entry point. Handles routing, authentication, and request aggregation.
- **auth-service**: Manages user authentication, JWT issuance, and Google OAuth2.
- **user-service**: Handles user profiles and user-specific data.
- **team-service**: Manages team creation, membership, and roles.
- **project-service**: Core project logic, including project lifecycle and settings.
- **task-service**: Handles tasks, Kanban boards, and backlogs.
- **sprint-service**: Manages Agile sprints and cycles.
- **epic-service**: Handles large-scale features and epics.
- **notification-service**: Manages real-time notifications (Socket.io) and email alerts.
- **search-service**: Integrates with Meilisearch for high-performance global search.
- **file-service**: Manages file uploads and interactions with MinIO (S3).
- **ai-discussion**: AI-powered analysis of team discussions and collaboration.
- **video-chat**: Integration logic for video communication features.

## 🛠 Tech Stack
- **Framework**: [NestJS](https://nestjs.com/)
- **Language**: TypeScript
- **Database**: 
  - **PostgreSQL**: Primary relational data (using TypeORM & Prisma)
  - **MongoDB**: Document storage for discussions/logs (using Mongoose)
  - **Redis**: Caching, Session management, and Pub/Sub
- **Message Broker**: RabbitMQ (using `@golevelup/nestjs-rabbitmq`)
- **Real-time**: Socket.io
- **Search Engine**: Meilisearch
- **Storage**: MinIO (S3-compatible)
- **Documentation**: Swagger (OpenAPI)

## 🚀 Getting Started

### Prerequisites
Ensure you have the infrastructure running via the root `docker-compose.yml`:
```bash
docker-compose up -d
```

### Installation
```bash
npm install
```

### Environment Configuration
Copy the `.env.example` to `.env` (if available) and configure your database and service credentials.

### Running Services
To start all services concurrently (Dev Mode):
```bash
npm run start:all
```

To start a specific service:
```bash
npm run start:dev:[service-name]
# Example: npm run start:dev:api-gateway
```

## 📜 Key Scripts
- `npm run start:all`: Starts all microservices using `concurrently`.
- `npm run build`: Compiles the monorepo.
- `npm run lint`: Runs ESLint for code quality.
- `npm run test`: Executes unit tests.

## 📡 API Documentation
Once the API Gateway is running, you can access the Swagger documentation at:
`http://localhost:3000/api/docs` (default port)
