import { Role } from "apps/api-gateway/enums/role.enum"

export class UserDto {
    id: number
    username: string
    password: string
    role: Role[]
}