import {
  Project,
  List,
  Task,
  Sprint,
  Epic,
  Label,
  Attachment,
  TaskAssignee,
  TaskLabel,
} from "@/types/project";
import {
  User,
  IAccount,
  Follow,
} from "@/types/auth";
import {
  Team,
  TeamMember,
} from "@/types/social";
import {
  Discussion,
  Message,
} from "@/types/communication";
import {
  Role,
  Provider,
  TeamStatus,
  MemberRole,
  ProjectVisibility,
  SprintStatus,
  EpicStatus,
  Priority,
  ListCategoryEnum,
} from "@/types/common/enums";

// ==========================================
// 1. CONSTANT IDs
// ==========================================

// ==========================================
// TEST ACCOUNTS
// ==========================================
// 1. Alice (Admin)
//    Email: alice@example.com
//    Password: password123
//
// 2. Bob (User)
//    Email: bob@example.com
//    Password: password123
//
// 3. Charlie (User)
//    Email: charlie@example.com
//    Password: password123
// ==========================================

// --- Users & Teams ---
const USER_ALICE_ID = "user-alice-1";
const USER_BOB_ID = "user-bob-2";
const USER_CHARLIE_ID = "user-charlie-3";
const TEAM_ALPHA_ID = "team-alpha-1";
const TEAM_BETA_ID = "team-beta-2";
const TEAM_GAMMA_ID = "team-gamma-3";
const TEAM_DELTA_ID = "team-delta-4";

// --- Discussions ---
const DISCUSSION_ALPHA_GENERAL_ID = "discussion-alpha-general-1";
const DISCUSSION_ALPHA_DEV_ID = "discussion-alpha-dev-2";

// --- Project 1: Phoenix ---
const PROJECT_PHOENIX_ID = "project-phoenix-1";
const PHOENIX_LIST_TODO_ID = "list-phoenix-todo-1";
const PHOENIX_LIST_INPROGRESS_ID = "list-phoenix-inprogress-2";
const PHOENIX_LIST_REVIEW_ID = "list-phoenix-review-3";
const PHOENIX_LIST_DONE_ID = "list-phoenix-done-4";
const PHOENIX_SPRINT_1_ID = "sprint-phoenix-1";
const PHOENIX_SPRINT_2_ID = "sprint-phoenix-2";
const PHOENIX_SPRINT_3_ID = "sprint-phoenix-3";
const PHOENIX_SPRINT_4_ID = "sprint-phoenix-4";
const PHOENIX_SPRINT_5_ID = "sprint-phoenix-5";
const PHOENIX_EPIC_AUTH_ID = "epic-phoenix-auth-1";
const PHOENIX_EPIC_PAYMENT_ID = "epic-phoenix-payment-2";
const PHOENIX_LABEL_BUG_ID = "label-phoenix-bug-1";
const PHOENIX_LABEL_FEATURE_ID = "label-phoenix-feature-2";
const PHOENIX_TASK_1_ID = "task-phoenix-1";
const PHOENIX_TASK_2_ID = "task-phoenix-2";
const PHOENIX_TASK_3_ID = "task-phoenix-3";
const PHOENIX_TASK_4_ID = "task-phoenix-4";
const PHOENIX_TASK_5_ID = "task-phoenix-5";
const PHOENIX_TASK_5_1_ID = "task-phoenix-5-1";
const PHOENIX_TASK_5_2_ID = "task-phoenix-5-2";
const PHOENIX_TASK_6_ID = "task-phoenix-6";
const PHOENIX_TASK_7_ID = "task-phoenix-7";
const PHOENIX_TASK_8_ID = "task-phoenix-8";
const PHOENIX_TASK_9_ID = "task-phoenix-9";
const PHOENIX_TASK_10_ID = "task-phoenix-10";
const PHOENIX_TASK_11_ID = "task-phoenix-11";
const PHOENIX_TASK_12_ID = "task-phoenix-12";
const PHOENIX_TASK_13_ID = "task-phoenix-13";
const PHOENIX_TASK_14_ID = "task-phoenix-14";
const PHOENIX_TASK_15_ID = "task-phoenix-15";
const PHOENIX_TASK_16_ID = "task-phoenix-16";

const PHOENIX_LABEL_DESIGN_ID = "label-phoenix-design-3";
const PHOENIX_LABEL_BACKEND_ID = "label-phoenix-backend-4";
const PHOENIX_LABEL_FRONTEND_ID = "label-phoenix-frontend-5";
const PHOENIX_LABEL_DOCS_ID = "label-phoenix-docs-6";

// --- Project 2: Pegasus ---
const PROJECT_PEGASUS_ID = "project-pegasus-2";
const PEGASUS_LIST_TODO_ID = "list-pegasus-todo-1";
const PEGASUS_LIST_INPROGRESS_ID = "list-pegasus-inprogress-2";
const PEGASUS_LIST_DONE_ID = "list-pegasus-done-3";
const PEGASUS_SPRINT_1_ID = "sprint-pegasus-1";
const PEGASUS_EPIC_DATA_ID = "epic-pegasus-data-1";
const PEGASUS_LABEL_AI_ID = "label-pegasus-ai-1";
const PEGASUS_LABEL_DATA_ID = "label-pegasus-data-2";
const PEGASUS_TASK_1_ID = "task-pegasus-1";
const PEGASUS_TASK_2_ID = "task-pegasus-2";
const PEGASUS_TASK_3_ID = "task-pegasus-3";

// --- Project 3: Empty ---
const PROJECT_EMPTY_ID = "project-empty-3";

// --- Project 4: Test Alpha ---
const PROJECT_TEST_ID = "project-test-alpha-1";
const TEST_LIST_TODO_ID = "list-test-todo-1";
const TEST_LIST_INPROGRESS_ID = "list-test-inprogress-2";
const TEST_LIST_DONE_ID = "list-test-done-3";
const TEST_SPRINT_1_ID = "sprint-test-1";
const TEST_SPRINT_2_ID = "sprint-test-2";
const TEST_SPRINT_3_ID = "sprint-test-3";
const TEST_TASK_1_ID = "task-test-1";
const TEST_TASK_2_ID = "task-test-2";

// ==========================================
// 2. MOCK DATA GENERATION
// ==========================================

// --- Users ---
const users: User[] = [
  {
    id: USER_ALICE_ID,
    email: "alice@example.com",
    name: "Alice",
    avatar: "https://i.pravatar.cc/150?u=alice",
    role: Role.ADMIN,
    isBan: false,
    isActive: true,
    isVerified: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: USER_BOB_ID,
    email: "bob@example.com",
    name: "Bob",
    phone: "123456789",
    role: Role.USER,
    isBan: false,
    isActive: true,
    isVerified: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: USER_CHARLIE_ID,
    email: "charlie@example.com",
    name: "Charlie",
    avatar: "https://i.pravatar.cc/150?u=charlie",
    role: Role.USER,
    isBan: false,
    isActive: true,
    isVerified: false,
    createdAt: new Date().toISOString(),
  },
];

// --- Accounts ---
const accounts: IAccount[] = [
  {
    id: "account-1",
    provider: Provider.GOOGLE,
    providerId: "google-123",
    email: "alice@example.com",
    userId: USER_ALICE_ID,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "account-2",
    provider: Provider.LOCAL,
    providerId: "local-456",
    email: "bob@example.com",
    userId: USER_BOB_ID,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// --- Teams & Members ---
const teams: Team[] = [
  {
    id: TEAM_ALPHA_ID,
    name: "Alpha Team",
    ownerId: USER_ALICE_ID,
    status: TeamStatus.ACTIVE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: TEAM_BETA_ID,
    name: "Beta Squad",
    ownerId: USER_BOB_ID,
    status: TeamStatus.ACTIVE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: TEAM_GAMMA_ID,
    name: "Gamma Group",
    ownerId: USER_CHARLIE_ID,
    status: TeamStatus.ACTIVE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: TEAM_DELTA_ID,
    name: "Delta Force",
    ownerId: USER_ALICE_ID,
    status: TeamStatus.ACTIVE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const team_members: TeamMember[] = [
  {
    id: "member-1",
    teamId: TEAM_ALPHA_ID,
    userId: USER_ALICE_ID,
    role: MemberRole.OWNER,
    isActive: true,
    joinedAt: new Date().toISOString(),
  },
  {
    id: "member-2",
    teamId: TEAM_ALPHA_ID,
    userId: USER_BOB_ID,
    role: MemberRole.MEMBER,
    isActive: true,
    joinedAt: new Date().toISOString(),
  },
  // Beta Team Members
  {
    id: "member-beta-1",
    teamId: TEAM_BETA_ID,
    userId: USER_BOB_ID,
    role: MemberRole.OWNER,
    isActive: true,
    joinedAt: new Date().toISOString(),
  },
  {
    id: "member-beta-2",
    teamId: TEAM_BETA_ID,
    userId: USER_ALICE_ID,
    role: MemberRole.MEMBER,
    isActive: true,
    joinedAt: new Date().toISOString(),
  },
  // Gamma Team Members
  {
    id: "member-gamma-1",
    teamId: TEAM_GAMMA_ID,
    userId: USER_CHARLIE_ID,
    role: MemberRole.OWNER,
    isActive: true,
    joinedAt: new Date().toISOString(),
  },
  {
    id: "member-gamma-2",
    teamId: TEAM_GAMMA_ID,
    userId: USER_BOB_ID,
    role: MemberRole.MEMBER,
    isActive: true,
    joinedAt: new Date().toISOString(),
  },
  {
    id: "member-gamma-3",
    teamId: TEAM_GAMMA_ID,
    userId: USER_ALICE_ID,
    role: MemberRole.MEMBER,
    isActive: true,
    joinedAt: new Date().toISOString(),
  },
  // Delta Team Members
  {
    id: "member-delta-1",
    teamId: TEAM_DELTA_ID,
    userId: USER_ALICE_ID,
    role: MemberRole.OWNER,
    isActive: true,
    joinedAt: new Date().toISOString(),
  },
];

// --- Projects ---
const projects: Project[] = [
  {
    id: PROJECT_PHOENIX_ID,
    name: "Project Phoenix",
    key: "PHX",
    description: "A next-generation project management tool.",
    icon: "🚀",
    visibility: ProjectVisibility.TEAM,
    teamId: TEAM_ALPHA_ID,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: PROJECT_PEGASUS_ID,
    name: "Project Pegasus",
    key: "PEG",
    description: "AI-powered analytics platform.",
    icon: "🤖",
    visibility: ProjectVisibility.PUBLIC,
    teamId: TEAM_ALPHA_ID,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: PROJECT_EMPTY_ID,
    name: "Project Empty",
    key: "EMP",
    description: "An empty project for testing initialization.",
    icon: "👻",
    visibility: ProjectVisibility.PRIVATE,
    teamId: TEAM_ALPHA_ID,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: PROJECT_TEST_ID,
    name: "Test Project Alpha",
    key: "TPA",
    description: "A project for testing sprints and tasks.",
    icon: "🧪",
    visibility: ProjectVisibility.PRIVATE,
    teamId: TEAM_ALPHA_ID,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// --- Lists (Workflow for Project Phoenix) ---
const lists: List[] = [
  {
    id: PHOENIX_LIST_TODO_ID,
    name: "To Do",
    position: 1,
    color: "#A1A1AA",
    projectId: PROJECT_PHOENIX_ID,
    category: ListCategoryEnum.TODO,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: PHOENIX_LIST_INPROGRESS_ID,
    name: "In Progress",
    position: 2,
    color: "#3B82F6",
    projectId: PROJECT_PHOENIX_ID,
    category: ListCategoryEnum.IN_PROGRESS,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: PHOENIX_LIST_REVIEW_ID,
    name: "In Review",
    position: 3,
    color: "#F59E0B",
    projectId: PROJECT_PHOENIX_ID,
    category: ListCategoryEnum.IN_PROGRESS,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: PHOENIX_LIST_DONE_ID,
    name: "Done",
    position: 4,
    color: "#10B981",
    projectId: PROJECT_PHOENIX_ID,
    category: ListCategoryEnum.DONE,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // --- Lists (Workflow for Project Pegasus) ---
  {
    id: PEGASUS_LIST_TODO_ID,
    name: "To Do",
    position: 1,
    color: "#A1A1AA",
    projectId: PROJECT_PEGASUS_ID,
    category: ListCategoryEnum.TODO,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: PEGASUS_LIST_INPROGRESS_ID,
    name: "In Progress",
    position: 2,
    color: "#3B82F6",
    projectId: PROJECT_PEGASUS_ID,
    category: ListCategoryEnum.IN_PROGRESS,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: PEGASUS_LIST_DONE_ID,
    name: "Done",
    position: 3,
    color: "#10B981",
    projectId: PROJECT_PEGASUS_ID,
    category: ListCategoryEnum.DONE,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // --- Lists (Workflow for Project Test Alpha) ---
  {
    id: TEST_LIST_TODO_ID,
    name: "To Do",
    position: 1,
    color: "#A1A1AA",
    projectId: PROJECT_TEST_ID,
    category: ListCategoryEnum.TODO,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: TEST_LIST_INPROGRESS_ID,
    name: "In Progress",
    position: 2,
    color: "#3B82F6",
    projectId: PROJECT_TEST_ID,
    category: ListCategoryEnum.IN_PROGRESS,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: TEST_LIST_DONE_ID,
    name: "Done",
    position: 3,
    color: "#10B981",
    projectId: PROJECT_TEST_ID,
    category: ListCategoryEnum.DONE,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// --- Sprints (for Project Phoenix) ---
const sprints: Sprint[] = [
  {
    id: PHOENIX_SPRINT_1_ID,
    title: "Sprint 1.0 - Foundation",
    goal: "Set up the project structure and auth.",
    startDate: "2025-11-01T00:00:00Z",
    endDate: "2025-11-14T23:59:59Z",
    projectId: PROJECT_PHOENIX_ID,
    status: SprintStatus.COMPLETED,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: PHOENIX_SPRINT_2_ID,
    title: "Sprint 2.0 - Core Features",
    goal: "Implement core task management features.",
    startDate: "2025-11-15T00:00:00Z",
    endDate: "2025-11-28T23:59:59Z",
    projectId: PROJECT_PHOENIX_ID,
    status: SprintStatus.ACTIVE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: PHOENIX_SPRINT_3_ID,
    title: "Sprint 3.0 - Advanced Features",
    goal: "Implement advanced reporting and analytics.",
    startDate: "2025-11-29T00:00:00Z",
    endDate: "2025-12-12T23:59:59Z",
    projectId: PROJECT_PHOENIX_ID,
    status: SprintStatus.PLANNED,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: PHOENIX_SPRINT_4_ID,
    title: "Sprint 4.0 - Optimization",
    goal: "Performance tuning and bug bashing.",
    startDate: "2025-12-13T00:00:00Z",
    endDate: "2025-12-26T23:59:59Z",
    projectId: PROJECT_PHOENIX_ID,
    status: SprintStatus.PLANNED,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: PHOENIX_SPRINT_5_ID,
    title: "Sprint 5.0 - Launch Prep",
    goal: "Final polish and marketing materials.",
    startDate: "2025-12-27T00:00:00Z",
    endDate: "2026-01-09T23:59:59Z",
    projectId: PROJECT_PHOENIX_ID,
    status: SprintStatus.PLANNED,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // --- Sprints (for Project Pegasus) ---
  {
    id: PEGASUS_SPRINT_1_ID,
    title: "Sprint 1.0 - Inception",
    goal: "Define data models and basic ingestion.",
    startDate: "2025-11-20T00:00:00Z",
    endDate: "2025-12-04T23:59:59Z",
    projectId: PROJECT_PEGASUS_ID,
    status: SprintStatus.ACTIVE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // --- Sprints (for Project Test Alpha) ---
  {
    id: TEST_SPRINT_1_ID,
    title: "Sprint 1 - Testing",
    goal: "Testing sprint functionality.",
    startDate: "2025-12-01T00:00:00Z",
    endDate: "2025-12-14T23:59:59Z",
    projectId: PROJECT_TEST_ID,
    status: SprintStatus.PLANNED,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: TEST_SPRINT_2_ID,
    title: "Sprint 2 - Testing",
    goal: "More testing.",
    startDate: "2025-12-15T00:00:00Z",
    endDate: "2025-12-28T23:59:59Z",
    projectId: PROJECT_TEST_ID,
    status: SprintStatus.PLANNED,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: TEST_SPRINT_3_ID,
    title: "Sprint 3 - Testing",
    goal: "Even more testing.",
    startDate: "2025-12-29T00:00:00Z",
    endDate: "2026-01-11T23:59:59Z",
    projectId: PROJECT_TEST_ID,
    status: SprintStatus.PLANNED,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// --- Epics (for Project Phoenix) ---
const epics: Epic[] = [
  {
    id: PHOENIX_EPIC_AUTH_ID,
    title: "User Authentication System",
    color: "#6366F1",
    description: "Implement login, registration, and password recovery.",
    status: EpicStatus.IN_PROGRESS,
    priority: Priority.HIGH,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: PHOENIX_EPIC_PAYMENT_ID,
    title: "Payment Integration",
    color: "#F97316",
    description: "Integrate Stripe for subscription payments.",
    status: EpicStatus.TODO,
    priority: Priority.HIGH,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // --- Epics (for Project Pegasus) ---
  {
    id: PEGASUS_EPIC_DATA_ID,
    title: "Data Pipeline",
    color: "#8B5CF6",
    description: "Build the data ingestion and processing pipeline.",
    status: EpicStatus.IN_PROGRESS,
    priority: Priority.HIGH,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// --- Labels (for Project Phoenix) ---
const labels: Label[] = [
  {
    id: PHOENIX_LABEL_BUG_ID,
    name: "Bug",
    color: "#EF4444",
    projectId: PROJECT_PHOENIX_ID,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: PHOENIX_LABEL_FEATURE_ID,
    name: "Feature",
    color: "#3B82F6",
    projectId: PROJECT_PHOENIX_ID,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: PHOENIX_LABEL_DESIGN_ID,
    name: "Design",
    color: "#EC4899",
    projectId: PROJECT_PHOENIX_ID,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: PHOENIX_LABEL_BACKEND_ID,
    name: "Backend",
    color: "#8B5CF6",
    projectId: PROJECT_PHOENIX_ID,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: PHOENIX_LABEL_FRONTEND_ID,
    name: "Frontend",
    color: "#14B8A6",
    projectId: PROJECT_PHOENIX_ID,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: PHOENIX_LABEL_DOCS_ID,
    name: "Documentation",
    color: "#6B7280",
    projectId: PROJECT_PHOENIX_ID,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // --- Labels (for Project Pegasus) ---
  {
    id: PEGASUS_LABEL_AI_ID,
    name: "AI Model",
    color: "#EC4899",
    projectId: PROJECT_PEGASUS_ID,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: PEGASUS_LABEL_DATA_ID,
    name: "Data Engineering",
    color: "#F59E0B",
    projectId: PROJECT_PEGASUS_ID,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// --- Tasks (for Project Phoenix) ---
const tasks: Task[] = [
  {
    id: PHOENIX_TASK_1_ID,
    title: "Design Login Page UI",
    description: "Create a Figma design for the login page.",
    projectId: PROJECT_PHOENIX_ID,
    listId: PHOENIX_LIST_DONE_ID,
    reporterId: USER_ALICE_ID,
    priority: Priority.MEDIUM,
    sprintId: PHOENIX_SPRINT_1_ID,
    epicId: PHOENIX_EPIC_AUTH_ID,
    position: 1,
    assigneeIds: ["member-1"],
    labelIds: [PHOENIX_LABEL_FEATURE_ID],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: PHOENIX_TASK_2_ID,
    title: "Fix login API 500 error",
    description: "The login endpoint crashes on invalid credentials.",
    projectId: PROJECT_PHOENIX_ID,
    listId: PHOENIX_LIST_INPROGRESS_ID,
    reporterId: USER_BOB_ID,
    priority: Priority.URGENT,
    sprintId: PHOENIX_SPRINT_2_ID,
    epicId: PHOENIX_EPIC_AUTH_ID,
    position: 1,
    assigneeIds: ["member-2"],
    labelIds: [PHOENIX_LABEL_BUG_ID],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: PHOENIX_TASK_3_ID,
    title: "Setup Database",
    description: "Initialize PostgreSQL and MongoDB containers.",
    projectId: PROJECT_PHOENIX_ID,
    listId: PHOENIX_LIST_DONE_ID,
    reporterId: USER_ALICE_ID,
    priority: Priority.HIGH,
    sprintId: PHOENIX_SPRINT_1_ID,
    epicId: PHOENIX_EPIC_AUTH_ID,
    position: 2,
    assigneeIds: ["member-1"],
    labelIds: [PHOENIX_LABEL_BACKEND_ID],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: PHOENIX_TASK_4_ID,
    title: "Create API Endpoints",
    description: "Implement RESTful APIs for user management.",
    projectId: PROJECT_PHOENIX_ID,
    listId: PHOENIX_LIST_DONE_ID,
    reporterId: USER_ALICE_ID,
    priority: Priority.HIGH,
    sprintId: PHOENIX_SPRINT_1_ID,
    epicId: PHOENIX_EPIC_AUTH_ID,
    position: 3,
    assigneeIds: ["member-1", "member-2"],
    labelIds: [PHOENIX_LABEL_BACKEND_ID],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: PHOENIX_TASK_5_ID,
    title: "Implement Frontend Auth",
    description: "Integrate authentication with the backend APIs.",
    projectId: PROJECT_PHOENIX_ID,
    listId: PHOENIX_LIST_INPROGRESS_ID,
    reporterId: USER_BOB_ID,
    priority: Priority.HIGH,
    sprintId: PHOENIX_SPRINT_2_ID,
    epicId: PHOENIX_EPIC_AUTH_ID,
    position: 2,
    assigneeIds: ["member-2"],
    labelIds: [PHOENIX_LABEL_FRONTEND_ID],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: PHOENIX_TASK_5_1_ID,
    title: "Login Form",
    description: "Create the login form component with validation.",
    projectId: PROJECT_PHOENIX_ID,
    listId: PHOENIX_LIST_INPROGRESS_ID,
    reporterId: USER_BOB_ID,
    priority: Priority.MEDIUM,
    sprintId: PHOENIX_SPRINT_2_ID,
    epicId: PHOENIX_EPIC_AUTH_ID,
    parentId: PHOENIX_TASK_5_ID,
    position: 1,
    assigneeIds: ["member-2"],
    labelIds: [PHOENIX_LABEL_FRONTEND_ID],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: PHOENIX_TASK_5_2_ID,
    title: "Register Form",
    description: "Create the registration form component.",
    projectId: PROJECT_PHOENIX_ID,
    listId: PHOENIX_LIST_TODO_ID,
    reporterId: USER_BOB_ID,
    priority: Priority.MEDIUM,
    sprintId: PHOENIX_SPRINT_2_ID,
    epicId: PHOENIX_EPIC_AUTH_ID,
    parentId: PHOENIX_TASK_5_ID,
    position: 1,
    assigneeIds: ["member-2"],
    labelIds: [PHOENIX_LABEL_FRONTEND_ID],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: PHOENIX_TASK_6_ID,
    title: "Design Dashboard",
    description: "Create high-fidelity mockups for the main dashboard.",
    projectId: PROJECT_PHOENIX_ID,
    listId: PHOENIX_LIST_REVIEW_ID,
    reporterId: USER_ALICE_ID,
    priority: Priority.MEDIUM,
    sprintId: PHOENIX_SPRINT_2_ID,
    epicId: null,
    position: 1,
    assigneeIds: ["member-1"],
    labelIds: [PHOENIX_LABEL_DESIGN_ID],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: PHOENIX_TASK_7_ID,
    title: "Setup CI/CD",
    description: "Configure GitHub Actions for automated testing and deployment.",
    projectId: PROJECT_PHOENIX_ID,
    listId: PHOENIX_LIST_DONE_ID,
    reporterId: USER_ALICE_ID,
    priority: Priority.URGENT,
    sprintId: PHOENIX_SPRINT_1_ID,
    epicId: null,
    position: 4,
    assigneeIds: ["member-1"],
    labelIds: [PHOENIX_LABEL_BACKEND_ID],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: PHOENIX_TASK_8_ID,
    title: "Write Documentation",
    description: "Document the API endpoints and project setup.",
    projectId: PROJECT_PHOENIX_ID,
    listId: PHOENIX_LIST_TODO_ID,
    reporterId: USER_CHARLIE_ID,
    priority: Priority.LOW,
    sprintId: PHOENIX_SPRINT_2_ID,
    epicId: null,
    position: 2,
    assigneeIds: ["member-1"],
    labelIds: [PHOENIX_LABEL_DOCS_ID],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: PHOENIX_TASK_9_ID,
    title: "Fix Navigation Bug",
    description: "Menu doesn't collapse on mobile devices.",
    projectId: PROJECT_PHOENIX_ID,
    listId: PHOENIX_LIST_TODO_ID,
    reporterId: USER_BOB_ID,
    priority: Priority.MEDIUM,
    sprintId: PHOENIX_SPRINT_2_ID,
    epicId: null,
    position: 3,
    assigneeIds: ["member-2"],
    labelIds: [PHOENIX_LABEL_BUG_ID, PHOENIX_LABEL_FRONTEND_ID],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: PHOENIX_TASK_10_ID,
    title: "Optimize Images",
    description: "Compress all static assets for better performance.",
    projectId: PROJECT_PHOENIX_ID,
    listId: PHOENIX_LIST_TODO_ID,
    reporterId: USER_CHARLIE_ID,
    priority: Priority.LOW,
    sprintId: PHOENIX_SPRINT_2_ID,
    epicId: null,
    position: 4,
    assigneeIds: [],
    labelIds: [PHOENIX_LABEL_FRONTEND_ID],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: PHOENIX_TASK_11_ID,
    title: "Implement Analytics Dashboard",
    description: "Create charts and graphs for project velocity.",
    projectId: PROJECT_PHOENIX_ID,
    listId: PHOENIX_LIST_TODO_ID,
    reporterId: USER_ALICE_ID,
    priority: Priority.HIGH,
    sprintId: PHOENIX_SPRINT_3_ID,
    epicId: null,
    position: 1,
    assigneeIds: ["member-1"],
    labelIds: [PHOENIX_LABEL_FEATURE_ID],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: PHOENIX_TASK_12_ID,
    title: "Optimize Database Queries",
    description: "Improve slow running queries for task retrieval.",
    projectId: PROJECT_PHOENIX_ID,
    listId: PHOENIX_LIST_TODO_ID,
    reporterId: USER_BOB_ID,
    priority: Priority.URGENT,
    sprintId: PHOENIX_SPRINT_4_ID,
    epicId: null,
    position: 1,
    assigneeIds: ["member-2"],
    labelIds: [PHOENIX_LABEL_BACKEND_ID],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: PHOENIX_TASK_13_ID,
    title: "Prepare Marketing Assets",
    description: "Create banners and social media posts.",
    projectId: PROJECT_PHOENIX_ID,
    listId: PHOENIX_LIST_TODO_ID,
    reporterId: USER_CHARLIE_ID,
    priority: Priority.LOW,
    sprintId: PHOENIX_SPRINT_5_ID,
    epicId: null,
    position: 1,
    assigneeIds: [],
    labelIds: [PHOENIX_LABEL_DESIGN_ID],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: PHOENIX_TASK_14_ID,
    title: "Stripe Webhook Handler",
    description: "Implement webhook handler for Stripe payment events.",
    projectId: PROJECT_PHOENIX_ID,
    listId: PHOENIX_LIST_TODO_ID,
    reporterId: USER_ALICE_ID,
    priority: Priority.HIGH,
    sprintId: null,
    epicId: PHOENIX_EPIC_PAYMENT_ID,
    position: 1,
    assigneeIds: ["member-1"],
    labelIds: [PHOENIX_LABEL_BACKEND_ID],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: PHOENIX_TASK_15_ID,
    title: "Invoice Generation PDF",
    description: "Generate PDF invoices for customers after payment.",
    projectId: PROJECT_PHOENIX_ID,
    listId: PHOENIX_LIST_TODO_ID,
    reporterId: USER_BOB_ID,
    priority: Priority.MEDIUM,
    sprintId: null,
    epicId: PHOENIX_EPIC_PAYMENT_ID,
    position: 2,
    assigneeIds: ["member-2"],
    labelIds: [PHOENIX_LABEL_BACKEND_ID],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: PHOENIX_TASK_16_ID,
    title: "Forgot Password Flow",
    description: "Implement forgot password email and reset flow.",
    projectId: PROJECT_PHOENIX_ID,
    listId: PHOENIX_LIST_TODO_ID,
    reporterId: USER_CHARLIE_ID,
    priority: Priority.HIGH,
    sprintId: null,
    epicId: PHOENIX_EPIC_AUTH_ID,
    position: 3,
    assigneeIds: [],
    labelIds: [PHOENIX_LABEL_FRONTEND_ID, PHOENIX_LABEL_BACKEND_ID],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // --- Tasks (for Project Pegasus) ---
  {
    id: PEGASUS_TASK_1_ID,
    title: "Define Data Schema",
    description: "Design the schema for user events.",
    projectId: PROJECT_PEGASUS_ID,
    listId: PEGASUS_LIST_DONE_ID,
    reporterId: USER_ALICE_ID,
    priority: Priority.HIGH,
    sprintId: PEGASUS_SPRINT_1_ID,
    epicId: PEGASUS_EPIC_DATA_ID,
    position: 1,
    assigneeIds: ["member-1"],
    labelIds: [PEGASUS_LABEL_DATA_ID],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: PEGASUS_TASK_2_ID,
    title: "Setup Kafka",
    description: "Deploy Kafka cluster for event streaming.",
    projectId: PROJECT_PEGASUS_ID,
    listId: PEGASUS_LIST_INPROGRESS_ID,
    reporterId: USER_ALICE_ID,
    priority: Priority.URGENT,
    sprintId: PEGASUS_SPRINT_1_ID,
    epicId: PEGASUS_EPIC_DATA_ID,
    position: 1,
    assigneeIds: ["member-2"],
    labelIds: [PEGASUS_LABEL_DATA_ID],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: PEGASUS_TASK_3_ID,
    title: "Train Initial Model",
    description: "Train the recommendation model with dummy data.",
    projectId: PROJECT_PEGASUS_ID,
    listId: PEGASUS_LIST_TODO_ID,
    reporterId: USER_CHARLIE_ID,
    priority: Priority.MEDIUM,
    sprintId: PEGASUS_SPRINT_1_ID,
    epicId: null,
    position: 1,
    assigneeIds: ["member-1", "member-2"],
    labelIds: [PEGASUS_LABEL_AI_ID],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // --- Tasks (for Project Test Alpha) ---
  {
    id: TEST_TASK_1_ID,
    title: "Test Task 1",
    description: "This is a test task in the backlog/sprint.",
    projectId: PROJECT_TEST_ID,
    listId: TEST_LIST_TODO_ID,
    reporterId: USER_ALICE_ID,
    priority: Priority.MEDIUM,
    sprintId: TEST_SPRINT_1_ID,
    epicId: null,
    position: 1,
    assigneeIds: ["member-1"],
    labelIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: TEST_TASK_2_ID,
    title: "Test Task 2",
    description: "Another test task.",
    projectId: PROJECT_TEST_ID,
    listId: TEST_LIST_TODO_ID,
    reporterId: USER_ALICE_ID,
    priority: Priority.LOW,
    sprintId: TEST_SPRINT_1_ID,
    epicId: null,
    position: 2,
    assigneeIds: ["member-1"],
    labelIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// --- Task Assignees ---
const task_assignees: TaskAssignee[] = [
  {
    taskId: PHOENIX_TASK_1_ID,
    teamMemberId: "member-1", // Alice
    assignedAt: new Date().toISOString(),
  },
  {
    taskId: PHOENIX_TASK_2_ID,
    teamMemberId: "member-2", // Bob
    assignedAt: new Date().toISOString(),
  },
  {
    taskId: PHOENIX_TASK_3_ID,
    teamMemberId: "member-1",
    assignedAt: new Date().toISOString(),
  },
  {
    taskId: PHOENIX_TASK_4_ID,
    teamMemberId: "member-1",
    assignedAt: new Date().toISOString(),
  },
  {
    taskId: PHOENIX_TASK_4_ID,
    teamMemberId: "member-2",
    assignedAt: new Date().toISOString(),
  },
  {
    taskId: PHOENIX_TASK_5_ID,
    teamMemberId: "member-2",
    assignedAt: new Date().toISOString(),
  },
  {
    taskId: PHOENIX_TASK_5_1_ID,
    teamMemberId: "member-2",
    assignedAt: new Date().toISOString(),
  },
  {
    taskId: PHOENIX_TASK_5_2_ID,
    teamMemberId: "member-2",
    assignedAt: new Date().toISOString(),
  },
  {
    taskId: PHOENIX_TASK_6_ID,
    teamMemberId: "member-1",
    assignedAt: new Date().toISOString(),
  },
  {
    taskId: PHOENIX_TASK_7_ID,
    teamMemberId: "member-1",
    assignedAt: new Date().toISOString(),
  },
  {
    taskId: PHOENIX_TASK_8_ID,
    teamMemberId: "member-1",
    assignedAt: new Date().toISOString(),
  },
  {
    taskId: PHOENIX_TASK_9_ID,
    teamMemberId: "member-2",
    assignedAt: new Date().toISOString(),
  },
  // --- Task Assignees (Pegasus) ---
  {
    taskId: PEGASUS_TASK_1_ID,
    teamMemberId: "member-1",
    assignedAt: new Date().toISOString(),
  },
  {
    taskId: PEGASUS_TASK_2_ID,
    teamMemberId: "member-2",
    assignedAt: new Date().toISOString(),
  },
  {
    taskId: PEGASUS_TASK_3_ID,
    teamMemberId: "member-1",
    assignedAt: new Date().toISOString(),
  },
  {
    taskId: PEGASUS_TASK_3_ID,
    teamMemberId: "member-2",
    assignedAt: new Date().toISOString(),
  },
  // --- Task Assignees (Test Alpha) ---
  {
    taskId: TEST_TASK_1_ID,
    teamMemberId: "member-1",
    assignedAt: new Date().toISOString(),
  },
  {
    taskId: TEST_TASK_2_ID,
    teamMemberId: "member-2",
    assignedAt: new Date().toISOString(),
  },
];

// --- Task Labels ---
const task_labels: TaskLabel[] = [
  { taskId: PHOENIX_TASK_1_ID, labelId: PHOENIX_LABEL_FEATURE_ID },
  { taskId: PHOENIX_TASK_2_ID, labelId: PHOENIX_LABEL_BUG_ID },
  { taskId: PHOENIX_TASK_3_ID, labelId: PHOENIX_LABEL_BACKEND_ID },
  { taskId: PHOENIX_TASK_4_ID, labelId: PHOENIX_LABEL_BACKEND_ID },
  { taskId: PHOENIX_TASK_5_ID, labelId: PHOENIX_LABEL_FRONTEND_ID },
  { taskId: PHOENIX_TASK_5_1_ID, labelId: PHOENIX_LABEL_FRONTEND_ID },
  { taskId: PHOENIX_TASK_5_2_ID, labelId: PHOENIX_LABEL_FRONTEND_ID },
  { taskId: PHOENIX_TASK_6_ID, labelId: PHOENIX_LABEL_DESIGN_ID },
  { taskId: PHOENIX_TASK_7_ID, labelId: PHOENIX_LABEL_BACKEND_ID },
  { taskId: PHOENIX_TASK_8_ID, labelId: PHOENIX_LABEL_DOCS_ID },
  { taskId: PHOENIX_TASK_9_ID, labelId: PHOENIX_LABEL_BUG_ID },
  { taskId: PHOENIX_TASK_9_ID, labelId: PHOENIX_LABEL_FRONTEND_ID },
  { taskId: PHOENIX_TASK_10_ID, labelId: PHOENIX_LABEL_FRONTEND_ID },
  // --- Task Labels (Pegasus) ---
  { taskId: PEGASUS_TASK_1_ID, labelId: PEGASUS_LABEL_DATA_ID },
  { taskId: PEGASUS_TASK_2_ID, labelId: PEGASUS_LABEL_DATA_ID },
  { taskId: PEGASUS_TASK_3_ID, labelId: PEGASUS_LABEL_AI_ID },
];

// --- Attachments ---
const attachments: Attachment[] = [
  {
    id: "attachment-1",
    taskId: PHOENIX_TASK_1_ID,
    fileName: "login-design.fig",
    fileUrl: "/mock/login-design.fig",
    uploadedById: USER_ALICE_ID,
    uploadedAt: new Date().toISOString(),
    fileType: "figma",
    fileSize: 1024 * 500, // 500KB
  },
];

// --- Discussions ---
const discussions: Discussion[] = [
  {
    id: DISCUSSION_ALPHA_GENERAL_ID,
    name: "General",
    ownerId: USER_ALICE_ID,
    teamId: TEAM_ALPHA_ID,
    isGroup: true,
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: DISCUSSION_ALPHA_DEV_ID,
    name: "Development",
    ownerId: USER_ALICE_ID,
    teamId: TEAM_ALPHA_ID,
    isGroup: true,
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// --- Messages ---
const messages: Message[] = [
  {
    id: "msg-1",
    discussionId: DISCUSSION_ALPHA_GENERAL_ID,
    content: "Welcome to the Alpha Team!",
    sender: {
      id: USER_ALICE_ID,
      name: "Alice",
      avatar: "https://i.pravatar.cc/150?u=alice",
    },
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "msg-2",
    discussionId: DISCUSSION_ALPHA_GENERAL_ID,
    content: "Thanks Alice! Excited to be here.",
    sender: {
      id: USER_BOB_ID,
      name: "Bob",
      avatar: null,
    },
    createdAt: new Date(Date.now() - 86400000 * 1.9).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1.9).toISOString(),
  },
  {
    id: "msg-3",
    discussionId: DISCUSSION_ALPHA_DEV_ID,
    content: "Has anyone checked the latest build?",
    sender: {
      id: USER_CHARLIE_ID,
      name: "Charlie",
      avatar: "https://i.pravatar.cc/150?u=charlie",
    },
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "msg-4",
    discussionId: DISCUSSION_ALPHA_DEV_ID,
    content: "Yes, it looks stable on staging.",
    sender: {
      id: USER_ALICE_ID,
      name: "Alice",
      avatar: "https://i.pravatar.cc/150?u=alice",
    },
    createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 mins ago
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
  },
];

// --- Credentials (MOCK ONLY) ---
const credentials = [
  {
    email: "alice@example.com",
    password: "password123",
    userId: USER_ALICE_ID,
    role: Role.ADMIN,
  },
  {
    email: "bob@example.com",
    password: "password123",
    userId: USER_BOB_ID,
    role: Role.USER,
  },
  {
    email: "charlie@example.com",
    password: "password123",
    userId: USER_CHARLIE_ID,
    role: Role.USER,
  },
];

// ==========================================
// 3. EXPORT DATABASE
// ==========================================

export const db = {
  users,
  accounts,
  teams,
  team_members,
  projects,
  lists,
  sprints,
  epics,
  labels,
  tasks,
  task_assignees,
  task_labels,
  attachments,
  discussions,
  messages,
  credentials,
};
