import { DiscussionType } from "../../enums";

export class CreateChannelDto {
    teamId: string;
    name: string;
    type: DiscussionType;
    parentId?: string;
    ownerId: string;
}

export class CreateCategoryDto {
    teamId: string;
    name: string;
    ownerId: string;
}

export class UpdateChannelDto {
    id: string;
    name?: string;
    parentId?: string;
    position?: number;
    isDeleted?: boolean;
}

export class ReorderChannelsDto {
    teamId: string;
    orders: { id: string; position: number; parentId?: string }[];
}
