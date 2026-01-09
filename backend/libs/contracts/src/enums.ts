// types/enums.ts

// --- Enums từ hệ thống Social/Team ---
export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum Provider {
  LOCAL = 'LOCAL',
  GOOGLE = 'GOOGLE',
  FACEBOOK = 'FACEBOOK',
  users = "users",
}

export enum TeamStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  DISBANDED = 'DISBANDED',
  DELETED = 'DELETED',
}

export enum MemberRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  SYSTEM = 'SYSTEM',
  AI = 'AI'
}

export enum ProjectVisibility {
  PRIVATE = 'PRIVATE',
  TEAM = 'TEAM',
  PUBLIC = 'PUBLIC',
}

// --- Discussion Membership Status ---
export enum MemberShip {
  ACTIVE = 'ACTIVE',
  LEFT = 'LEFT'
}


export enum NotificationType {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  INFO = 'INFO',
  WARNING = 'WARNING',
  PENDING = 'PENDING',
}



export enum CallType {
  TEAM_CALL = 'TEAM_CALL',
  DIRECT_CALL = 'DIRECT_CALL',
}

export enum TeamAction {
  TEAM_CREATED = 'TEAM_CREATED',
  TEAM_UPDATED = 'TEAM_UPDATED',
  MEMBER_ADDED = 'MEMBER_ADDED',
  MEMBER_REMOVED = 'MEMBER_REMOVED',
  PROJECT_CREATED = 'PROJECT_CREATED',
  PROJECT_DELETED = 'PROJECT_DELETED',
  TASK_CREATED = 'TASK_CREATED',
  TASK_MOVED = 'TASK_MOVED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  MEMBER_INVITED = 'MEMBER_INVITED'
}

// --- Enums cho hệ thống Hybrid (Jira) ---
export enum SprintStatus {
  PLANNED = 'planned',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum EpicStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
  CANCELED = 'canceled',
}


// --- Enum "CHỦ LỰC" MỚI (Từ 'status.interface.ts') ---
export enum ListCategoryEnum {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}
