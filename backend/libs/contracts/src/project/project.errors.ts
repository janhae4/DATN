/**
 * Error codes for the Project module
 * Follows the format: PROJECT_<ACTION>_<ERROR_TYPE>
 */
export enum ProjectErrorCode {
  // Not Found Errors (4xx)
  PROJECT_NOT_FOUND = 'PROJECT_NOT_FOUND',
  PROJECT_MEMBER_NOT_FOUND = 'PROJECT_MEMBER_NOT_FOUND',
  PROJECT_STATUS_NOT_FOUND = 'PROJECT_STATUS_NOT_FOUND',
  
  // Validation Errors (4xx)
  INVALID_PROJECT_DATA = 'INVALID_PROJECT_DATA',
  INVALID_STATUS_TRANSITION = 'INVALID_STATUS_TRANSITION',
  
  // Permission Errors (4xx)
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Conflict Errors (4xx)
  PROJECT_ALREADY_EXISTS = 'PROJECT_ALREADY_EXISTS',
  DUPLICATE_PROJECT_NAME = 'DUPLICATE_PROJECT_NAME',
  
  // Server Errors (5xx)
  PROJECT_CREATION_FAILED = 'PROJECT_CREATION_FAILED',
  PROJECT_UPDATE_FAILED = 'PROJECT_UPDATE_FAILED',
  PROJECT_DELETION_FAILED = 'PROJECT_DELETION_FAILED',
  PROJECT_STATUS_UPDATE_FAILED = 'PROJECT_STATUS_UPDATE_FAILED',
}

/**
 * Custom error class for project-related errors
 */
export class ProjectError extends Error {
  constructor(
    public readonly code: ProjectErrorCode,
    message: string,
    public readonly details?: Record<string, any>,
  ) {
    super(message);
    this.name = 'ProjectError';
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ProjectError);
    }
  }
}

/**
 * Helper function to create a ProjectError
 */
export function createProjectError(
  code: ProjectErrorCode,
  message: string,
  details?: Record<string, any>,
): ProjectError {
  return new ProjectError(code, message, details);
}

/**
 * Type guard to check if an error is a ProjectError
 */
export function isProjectError(error: unknown): error is ProjectError {
  return error instanceof ProjectError || 
         (error instanceof Error && 'code' in error && 
          Object.values(ProjectErrorCode).includes((error as any).code));
}
