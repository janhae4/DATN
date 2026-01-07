# DATN Frontend - Modern Project Management UI

The frontend application for the DATN system, built with **Next.js 15+**, focused on high performance, rich aesthetics, and a premium user experience.

## ✨ Features
- **Interactive Dashboards**: Dynamic overview of projects, tasks, and team activities.
- **Advanced Task Management**: Drag-and-drop Kanban boards, nested backlogs, and agile sprint planning.
- **Collaborative Workspace**: Real-time chat, shared calendars, and team directory.
- **AI Assistant**: Built-in AI interface for task generation, content suggestions, and smart search.
- **Rich Visualizations**: Gantt charts, productivity analytics, and project timelines.
- **Responsive Design**: fully responsive UI optimized for desktops and tablets.

## 🚀 Tech Stack
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Styling**: 
  - [Tailwind CSS 4](https://tailwindcss.com/)
  - [Framer Motion](https://www.framer.com/motion/) (Animations)
- **UI Components**:
  - [Shadcn UI](https://ui.shadcn.com/)
  - [Radix UI](https://www.radix-ui.com/)
  - [Lucide React](https://lucide.dev/) (Icons)
- **Data Fetching & State**:
  - [TanStack Query v5](https://tanstack.com/query/latest)
  - [Axios](https://axios-http.com/)
- **Forms**: 
  - [React Hook Form](https://react-hook-form.com/)
  - [Zod](https://zod.dev/) (Validation)
- **Real-time**: [Socket.io-client](https://socket.io/)
- **Charts & Calendars**:
  - [Recharts](https://recharts.org/)
  - [Schedule-X](https://schedule-x.dev/)
  - [gantt-task-react](https://github.com/MaTeMaTuK/gantt-task-react)

## 📁 Project Structure
```text
frontend/
├── app/                # Next.js App Router (Pages & Layouts)
├── components/         # Reusable UI components
│   ├── ui/             # Shadcn UI primitives
│   ├── shared/         # Shared business components
│   └── features/       # Feature-specific components (team, task, project)
├── hooks/              # Custom React hooks (Data fetching & logic)
├── services/           # API service layer (Axios instances)
├── store/              # Global state management
├── types/              # TypeScript definitions
├── lib/                # Utility functions
└── public/             # Static assets
```

## 🛠 Getting Started

### Installation
```bash
npm install
```

### Environment Setup
Create a `.env.local` file in the root of the `frontend` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

### Running the App
Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5000`.

## 🎨 Design Principles
- **Minimalist Aesthetic**: Clean lines, subtle shadows, and a focused color palette.
- **Micro-interactions**: Smooth transitions and hover effects to enhance user engagement.
- **Performance First**: Optimized images, code splitting, and efficient data caching with TanStack Query.
