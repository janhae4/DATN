import { EventUserSnapshot } from "@app/contracts/team/dto/create-team.dto";
import { BoardVisibility } from "../entity/board.entity";
import { BoardSnapshot } from "./board-snapshot.dto";

export class CreateBoardDto {
    name: string;
    teamId: string;
    visibility: BoardVisibility;
}

export class BoardCreatedEventPayload {
    board: BoardSnapshot
    requester: EventUserSnapshot
}