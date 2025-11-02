import { RequestPaginationDto } from "@app/contracts/pagination.dto"

export class FindUserDto {
    key: string
    options: RequestPaginationDto
    requesterId: string
    teamId?: string
}