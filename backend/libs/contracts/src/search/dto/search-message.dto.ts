import { RequestPaginationDto } from "@app/contracts/pagination.dto"

export class SearchMessageDto {
    userId: string
    query: string
    discussionId: string
    options: RequestPaginationDto
}