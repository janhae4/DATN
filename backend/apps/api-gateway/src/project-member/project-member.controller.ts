import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AddProjectMemberDto } from '@app/contracts/project-member/add-project-member.dto';
import { UpdateProjectMemberDto } from '@app/contracts/project-member/update-project-member.dto';
import { ProjectMemberService } from './project-member.service';
import { CurrentUser } from '../common/role/current-user.decorator';
import { RemoveProjectMemberDto } from '@app/contracts/project-member/remove-project-member.dto';
import { Roles } from '../common/role/role.decorator';
import { Role } from '@app/contracts';
@Controller('projects/members')
export class ProjectMemberController {
    constructor(private readonly projectMemberService: ProjectMemberService) { }

    @Get()
    @Roles(Role.USER)
    async getMembers(@Body() projectId: { projectId: string }, @CurrentUser("id") userId: string) {

        return this.projectMemberService.getMembers(projectId.projectId, userId);
    }

    @Post()
    @Roles(Role.USER)
    async addMember(
        @Body() addDto: AddProjectMemberDto,
        @CurrentUser("id") userId: string,
    ) {
        console.log("current user id: ", userId);

        return this.projectMemberService.addMember(
            addDto,
            userId,
        );
    }

    @Put(':userId/role')
    async updateMemberRole(
        @Body() updateDto: UpdateProjectMemberDto,
        @CurrentUser("id") userId: string,
    ) {

        return this.projectMemberService.updateMemberRole(
            updateDto,
            userId,
        );
    }

    @Delete()
    async removeMember(
        @Body() removeDto: RemoveProjectMemberDto,
        @CurrentUser("id") userId: string,
    ) {

        return this.projectMemberService.removeMember(
            removeDto,
            userId,
        );
    }
}
