# DATN - Modern Project & Team Management System

A comprehensive, microservices-based project management platform designed for team collaboration, featuring real-time communication, AI-powered assistance, and integrated productivity tools.

## 🚀 Overview
This project is a graduation thesis (Đồ Án Tốt Nghiệp) that implements a full-stack, scalable solution for modern teams. It combines robust task management with real-time features and AI integrations.

### Key Features
- **Project Management**: Kanban boards, Backlogs, Sprints, Epics, and Timeline (Gantt) views.
- **Team Collaboration**: Team creation, member roles (Owner, Admin, Member), and invitations.
- **Real-time Communication**: Instant messaging, notifications, and video chat integrations.
- **AI Integration**: AI Assistant for task generation, discussion analysis, and chatbot-driven insights.
- **Integrated Tools**: Calendar sync, File storage (MinIO), and powerful Search (Meilisearch).

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 15+ (App Router, TypeScript)
- **Styling**: Tailwind CSS 4, Framer Motion
- **UI Components**: Shadcn UI, Radix UI
- **State & Data**: TanStack Query, Axios, Socket.io-client
- **Visuals**: Recharts, dnd-kit, Gantt-task-react

### Backend (Microservices)
- **Framework**: NestJS (TypeScript)
- **Communications**: RabbitMQ (Queue), Redis (Pub/Sub), Socket.io
- **Databases**: PostgreSQL (TypeORM/Prisma), MongoDB (Mongoose), Redis
- **Storage**: MinIO S3-compatible storage
- **Search**: Meilisearch
- **Auth**: Passport.js (JWT, Google OAuth2)

### AI & Others
- **Vector DB**: ChromaDB
- **LLM**: Integrated via local providers (Ollama/Python services)
- **Language**: Python (for specialized AI services)

## 📦 Project Structure
```text
DATN/
├── backend/            # NestJS Microservices monorepo
├── frontend/           # Next.js 15+ application
├── python/             # Specialized AI services (NLP, Chatbot)
├── ml/                 # Machine learning models & training
├── docker-compose.yml  # Infrastructure configuration (DBs, Brokers, etc.)
└── README.md           # This file
```

## 🚥 Getting Started

### Prerequisites
- [Docker](https://www.docker.com/) & Docker Compose
- [Node.js](https://nodejs.org/) (v20+)
- [pnpm](https://pnpm.io/) or [npm](https://www.npmjs.com/)

### 1. Infrastructure Setup
Run the supporting services using Docker Compose:
```bash
docker-compose up -d
```

### 2. Backend Initialization
Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
npm run start:all
```

### 3. Frontend Initialization
Navigate to the frontend directory and install dependencies:
```bash
cd frontend
npm install
npm run dev
```

The application should now be accessible at `http://localhost:5000` (Frontend) and the API Gateway at `http://localhost:3000`.

## 📄 License
This project is part of a Graduation Thesis. All rights reserved.
