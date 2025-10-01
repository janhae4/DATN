// Shared task error contracts
export type TaskErrorPayload = {
  code: TaskErrorCode;
  message: string;
};

export enum TaskErrorCode {
  TASK_NOT_FOUND = 'TASK_NOT_FOUND',
}

export const TASK_ERRORS = {
  NOT_FOUND: (id?: number): TaskErrorPayload => ({
    code: TaskErrorCode.TASK_NOT_FOUND,
    message: `Task${id !== undefined ? ` with id ${id}` : ''} not found`,
  }),
} as const;
