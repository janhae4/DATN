export class MoveListDto {
    listId: string;
    newPosition: number;
}

export class ListMovedEventPayload {
    listId: string;
    boardId: string;
    newPosition: number;
    requesterId: string;
}