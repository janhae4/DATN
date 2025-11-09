import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UpdateProjectMemberDto } from '@app/contracts/project-member/update-project-member.dto';
import { RemoveProjectMemberDto } from '@app/contracts/project-member/remove-project-member.dto';
import { PROJECT_MEMBER_PATTERNS } from '@app/contracts/project-member/project-member.pattern';
import { ProjectMemberService } from './project-member.service';
import { AddProjectMemberDto } from '@app/contracts/project-member/add-project-member.dto';

@Controller()
export class ProjectMemberController {
    constructor(private readonly projectMemberService: ProjectMemberService) { }

    @MessagePattern(PROJECT_MEMBER_PATTERNS.GET_PROJECT_MEMBERS)
    async getMembers(@Payload() data: { projectId: string, userId: string }) {
        return this.projectMemberService.getMembers(data.projectId, data.userId);
    }

    @MessagePattern(PROJECT_MEMBER_PATTERNS.ADD_PROJECT_MEMBER)
    async addMember(
        @Payload() data: {
            addDto: AddProjectMemberDto,
            userId: string
        }
    ) {

        console.log("current user in controller: ", data.userId);

        return this.projectMemberService.addMember(
            data.addDto,
            data.userId
        );
    }

    @MessagePattern(PROJECT_MEMBER_PATTERNS.UPDATE_PROJECT_MEMBER_ROLE)
    async updateMemberRole(
        @Payload() data: {
            updateDto: UpdateProjectMemberDto,
            userId: string
        }
    ) {
        return this.projectMemberService.updateMemberRole(
            data.updateDto,
            data.userId
        );
    }

    @MessagePattern(PROJECT_MEMBER_PATTERNS.REMOVE_PROJECT_MEMBER)
    async removeMember(
        @Payload() data: {
            removeDto: RemoveProjectMemberDto,
            userId: string
        }
    ) {

        return this.projectMemberService.removeMember(
            data.removeDto,
            data.userId
        );
    }
}
