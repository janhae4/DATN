import { EventUserSnapshot } from "@app/contracts/team/dto/create-team.dto";
import { BoardSnapshot } from "./board-snapshot.dto";
import { ListSnapshot } from "./list-snapshot.dto";

export class CreateListDto {
    title: string;
    boardId: string;
}

export class ListCreatedEventPayload {
    list: ListSnapshot;
    board: BoardSnapshot;
    requester: EventUserSnapshot;
}