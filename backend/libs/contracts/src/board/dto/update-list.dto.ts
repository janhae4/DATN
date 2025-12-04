export class UpdateListDto {
    listId: string;
    position: number;
    title: string;
}

export class ListUpdatedEventPayload {
    listId: string;
    boardId: string;
    position: number;
    title: string;
    requesterId: string;
}