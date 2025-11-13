// Các import này được lấy từ nội dung bạn cung cấp
import { Attachment } from "@/types/attachment.interface";
import { Epic } from "@/types/epic.type";
import { Label } from "@/types/label.interface";
import { Project } from "@/types/project.type";
import { Sprint } from "@/types/sprint.type";
import { Status, statusEnum } from "@/types/status.interface";
import { Task } from "@/types/task.type";
import { User } from "@/types/user.interface";
import { Provider } from "@/types/user.interface";

// --- Định nghĩa ID cố định để liên kết ---
const USER_1_ID = "user-1";
const USER_2_ID = "user-2";
const PROJECT_1_ID = "project-1";
const SPRINT_1_ID = "sprint-1";
const SPRINT_2_ID = "sprint-2";
const SPRINT_3_ID = "sprint-3";
const STATUS_1_ID = "status-1-todo";
const STATUS_2_ID = "status-2-inprogress";
const STATUS_3_ID = "status-3-done";
const LABEL_1_ID = "label-1-bug";
const LABEL_2_ID = "label-2-feature";
const EPIC_1_ID = "epic-1-auth";
const TASK_1_ID = "task-1-parent";
const TASK_2_ID = "task-2-subtask";
const TASK_3_ID = "task-3-subtask";
const TASK_4_ID = "task-4-bug";
const ATTACHMENT_1_ID = "attachment-1";

// --- ID MỚI ---
const USER_3_ID = "user-3";
const PROJECT_2_ID = "project-2";
const STATUS_4_ID = "status-4-review"; // Mới cho Project 1
const STATUS_7_ID = "status-7-code-review"; // Mới: Code Review
const STATUS_8_ID = "status-8-testing"; // Mới: Testing
const STATUS_5_ID = "status-5-backlog"; // Mới cho Project 2
const STATUS_6_ID = "status-6-p2-done"; // Mới cho Project 2
const LABEL_3_ID = "label-3-design";
const LABEL_4_ID = "label-4-backend";
const LABEL_5_ID = "label-5-backend";
const EPIC_2_ID = "epic-2-payment";
const TASK_5_ID = "task-5-payment-api";
const TASK_6_ID = "task-6-payment-ui";
const TASK_7_ID = "task-7-no-epic";
const ATTACHMENT_2_ID = "attachment-2";

// --- Bảng Users ---
const users: User[] = [
  {
    id: USER_1_ID,
    name: "Alice",
    email: "alice@example.com",
    username: "alice",
    provider: Provider.GOOGLE,
    avatar: "https://example.com/avatar/alice.png",
  },
  {
    id: USER_2_ID,
    name: "Bob",
    email: "bob@example.com",
    username: "bob",
    provider: Provider.LOCAL,
    phone: "0987654321",
  },
  // --- THÊM MỚI (1) ---
  {
    id: USER_3_ID,
    name: "Charlie",
    email: "charlie@example.com",
    username: "charlie",
    provider: Provider.LOCAL,
    avatar: "https://example.com/avatar/charlie.png",
  },
];

// --- Bảng Projects ---
const projects: Project[] = [
  {
    id: PROJECT_1_ID,
    name: "Project Phoenix",
    description: "Dự án quản lý công việc thế hệ mới.",
    ownerId: USER_1_ID, // Alice là owner
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // --- THÊM MỚI (2) ---
  {
    id: PROJECT_2_ID,
    name: "Mobile App (Project 2)",
    description: "Dự án app di động.",
    ownerId: USER_3_ID, // Charlie là owner
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// --- Bảng Status (cho Project 1 & 2) ---
const statuses: Status[] = [
  {
    id: STATUS_1_ID,
    name: "To Do",
    color: "#CCCCCC",
    order: 0,
    status: statusEnum.todo,
    projectId: PROJECT_1_ID,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: STATUS_2_ID,
    name: "In Progress",
    color: "#007BFF",
    order: 1,
    status: statusEnum.in_progress,
    projectId: PROJECT_1_ID,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // --- THÊM MỚI (3) --- (Thêm trạng thái Review cho Project 1)
  {
    id: STATUS_4_ID,
    name: "In Review",
    color: "#F0AD4E",
    order: 2,
    status: statusEnum.in_progress,
    projectId: PROJECT_1_ID,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: STATUS_7_ID,
    name: "Code Review",
    color: "#8B5CF6",
    order: 3,
    status: statusEnum.in_progress,
    projectId: PROJECT_1_ID,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: STATUS_8_ID,
    name: "Testing",
    color: "#F97316",
    order: 4,
    status: statusEnum.in_progress,
    projectId: PROJECT_1_ID,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // --- CẬP NHẬT (order) --- (Cập nhật order của Done)
  {
    id: STATUS_3_ID,
    name: "Done",
    color: "#28A745",
    order: 5, // Cập nhật order để nằm sau the new in-progress stages
    status: statusEnum.done,
    projectId: PROJECT_1_ID,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // --- THÊM MỚI (4) --- (Status cho Project 2)
  {
    id: STATUS_5_ID,
    name: "Backlog",
    color: "#5BC0DE",
    order: 0,
    status: statusEnum.todo,
    projectId: PROJECT_2_ID,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // --- THÊM MỚI (5) --- (Status cho Project 2)
  {
    id: STATUS_6_ID,
    name: "Done",
    color: "#28A745",
    order: 1,
    status: statusEnum.done,
    projectId: PROJECT_2_ID,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// --- Bảng Sprints (cho Project 1) ---
const sprints: Sprint[] = [
  {
    id: SPRINT_1_ID,
    title: "Sprint 1.0",
    goal: "Hoàn thành setup dự án",
    start_date: new Date("2025-10-01T00:00:00Z").toISOString(),
    end_date: new Date("2025-10-14T23:59:59Z").toISOString(),
    projectId: PROJECT_1_ID,
    status: "completed",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
    {
      id: SPRINT_2_ID,
      title: "Sprint 2.0 - Auth",
      goal: "Hoàn thành tính năng xác thực",
      start_date: new Date("2025-10-15T00:00:00Z").toISOString(),
      end_date: new Date("2025-10-28T23:59:59Z").toISOString(),
      projectId: PROJECT_1_ID,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: SPRINT_3_ID,
      title: "Sprint 3.0 - Payment",
      goal: "Triển khai tính năng thanh toán",
      start_date: new Date("2025-10-29T00:00:00Z").toISOString(),
      end_date: new Date("2025-11-11T23:59:59Z").toISOString(),
      projectId: PROJECT_1_ID,
      status: "planned",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

// --- Bảng Labels (cho Project 1) ---
const labels: Label[] = [
  {
    id: LABEL_1_ID,
    name: "Bug",
    color: "#D73A4A",
    projectId: PROJECT_1_ID,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: LABEL_2_ID,
    name: "Feature",
    color: "#007BFF",
    projectId: PROJECT_1_ID,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // --- THÊM MỚI (6) ---
  {
    id: LABEL_3_ID,
    name: "Design",
    color: "#A29BFE",
    projectId: PROJECT_1_ID,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // --- THÊM MỚI (7) ---
    {
      id: LABEL_4_ID,
      name: "Backend",
      color: "#FDCB6E",
      projectId: PROJECT_1_ID,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: LABEL_5_ID,
      name: "Frontend",
      color: "#FDCB6E",
      projectId: PROJECT_1_ID,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    

];

// --- Bảng Epics (cho Project 1) ---
const epics: Epic[] = [
  {
    id: EPIC_1_ID,
    title: "Xây dựng tính năng Xác thực người dùng",
    description: "Bao gồm đăng nhập, đăng ký, quên mật khẩu.",
    status: "in_progress",
    priority: "high",
    ownerId: USER_1_ID,
    memberIds: [USER_1_ID, USER_2_ID],
    projectId: PROJECT_1_ID,
    sprintId: SPRINT_2_ID,
    start_date: new Date("2025-10-15T00:00:00Z").toISOString(),
    due_date: new Date("2025-10-28T23:59:59Z").toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // --- THÊM MỚI (8) ---
  {
    id: EPIC_2_ID,
    title: "Tích hợp cổng thanh toán",
    description: "Tích hợp Stripe và PayPal.",
    status: "todo",
    priority: "high",
    ownerId: USER_1_ID,
    memberIds: [USER_1_ID, USER_2_ID, USER_3_ID],
    projectId: PROJECT_1_ID,
    sprintId: null, // Chưa cho vào sprint nào
    start_date: null,
    due_date: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// --- Bảng Tasks (cho Project 1) ---
const tasks: Task[] = [
  {
    id: TASK_1_ID,
    title: "Thiết kế giao diện Login & Register",
    description: "Thiết kế trên Figma",
    statusId: STATUS_3_ID,
    priority: "medium",
    assigneeIds: [USER_1_ID],
    due_date: new Date("2025-10-10T23:59:59Z").toISOString(),
    epicId: EPIC_1_ID,
    projectId: PROJECT_1_ID,
    sprintId: SPRINT_1_ID,
    labelIds: [LABEL_2_ID, LABEL_3_ID, LABEL_4_ID, LABEL_5_ID], // Thêm label Design
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: TASK_2_ID,
    title: "[Subtask] Thiết kế trang Login",
    statusId: STATUS_3_ID,
    priority: null,
    assigneeIds: [USER_1_ID],
    due_date: null,
    projectId: PROJECT_1_ID,
    sprintId: SPRINT_1_ID,
    labelIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: TASK_3_ID,
    title: "[Subtask] Thiết kế trang Register",
    statusId: STATUS_3_ID,
    priority: null,
    assigneeIds: [USER_1_ID],
    due_date: null,
    projectId: PROJECT_1_ID,
    sprintId: SPRINT_1_ID,
    labelIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: TASK_4_ID,
    title: "API Login trả về lỗi 500",
    description: "Khi nhập sai mật khẩu, server bị crash",
    statusId: STATUS_2_ID,
    priority: "high",
    assigneeIds: [USER_2_ID],
    due_date: new Date("2025-10-20T23:59:59Z").toISOString(),
    epicId: EPIC_1_ID,
    projectId: PROJECT_1_ID,
    sprintId: SPRINT_2_ID,
    labelIds: [LABEL_1_ID, LABEL_4_ID], // Thêm label Backend
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // --- THÊM MỚI (9) ---
  {
    id: TASK_5_ID,
    title: "Triển khai API thanh toán Stripe",
    description: "Cần đọc document của Stripe",
    statusId: STATUS_2_ID, // In Progress
    priority: "high",
    assigneeIds: [USER_2_ID], // Giao cho Bob
    due_date: null,
    epicId: EPIC_2_ID, // Thuộc Epic Payment
    projectId: PROJECT_1_ID,
    sprintId: SPRINT_2_ID, // Làm trong Sprint 2
    labelIds: [LABEL_4_ID], // Label Backend
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // --- THÊM MỚI (10) ---
  {
    id: TASK_6_ID,
    title: "Thiết kế giao diện trang thanh toán",
    description: "Thiết kế UI/UX cho trang checkout",
    statusId: STATUS_1_ID, // To Do
    priority: "medium",
    assigneeIds: [USER_1_ID, USER_3_ID], // Giao cho Alice và Charlie
    due_date: null,
    epicId: EPIC_2_ID, // Thuộc Epic Payment
    projectId: PROJECT_1_ID,
    sprintId: null, // Chưa vào sprint
    labelIds: [LABEL_3_ID], // Label Design
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // --- THÊM MỚI (11) ---
  {
    id: TASK_7_ID,
    title: "Nâng cấp bảo mật cho Project 2",
    description: "Task cho project 2, không thuộc epic nào",
    statusId: STATUS_5_ID, // Backlog (của Project 2)
    priority: "low",
    assigneeIds: [USER_3_ID], // Giao cho Charlie
    due_date: null,
    epicId: null,
    projectId: PROJECT_2_ID, // Thuộc Project 2
    sprintId: null,
    labelIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// --- Bảng Attachments ---
const attachments: Attachment[] = [
  {
    id: ATTACHMENT_1_ID,
    taskId: TASK_1_ID,
    fileName: "design_login_v1.fig",
    fileUrl: "https://example.com/files/design_login_v1.fig",
    uploadedById: USER_1_ID,
    uploadedAt: new Date().toISOString(),
    fileType: "application/figma",
    fileSize: 1024 * 512,
  },
  // --- THÊM MỚI (12) ---
  {
    id: ATTACHMENT_2_ID,
    taskId: TASK_4_ID, // Đính kèm cho task "API Login trả về lỗi 500"
    fileName: "error_screenshot.png",
    fileUrl: "https://example.com/files/error_screenshot.png",
    uploadedById: USER_2_ID, // Bob upload
    uploadedAt: new Date().toISOString(),
    fileType: "image/png",
    fileSize: 1024 * 120, // 120 KB
  },
];

// --- Export toàn bộ DB ---
export const db = {
  users,
  projects,
  statuses,
  sprints,
  labels,
  epics,
  tasks,
  attachments,
};
