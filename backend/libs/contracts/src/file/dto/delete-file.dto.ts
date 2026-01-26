export class DeleteFilePayload {
  fileId: string;
  userId: string;
  projectId?: string;
}

export class DeleteManyFilePayload {
  fileIds: string[];
  userId: string;
  projectId?: string;
  teamId?: string
}
