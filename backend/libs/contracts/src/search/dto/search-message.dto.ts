import { PaginationDto } from "@app/contracts/pagination.dto"

export class SearchMessageDto {
    query: string
    conversationId: string
    options: PaginationDto
}