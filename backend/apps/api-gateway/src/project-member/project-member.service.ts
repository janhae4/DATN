import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AddProjectMemberDto } from '@app/contracts/project-member/add-project-member.dto';
import { UpdateProjectMemberDto } from '@app/contracts/project-member/update-project-member.dto';
import { RemoveProjectMemberDto } from '@app/contracts/project-member/remove-project-member.dto';
import { PROJECT_CLIENT } from '@app/contracts';
import { PROJECT_MEMBER_PATTERNS } from '@app/contracts/project-member/project-member.pattern';

@Injectable()
export class ProjectMemberService {
    
  constructor(
    @Inject(PROJECT_CLIENT) private readonly client: ClientProxy,
  ) {}

  async getMembers(projectId: string, userId: string) {
    return firstValueFrom(
      this.client.send(
        PROJECT_MEMBER_PATTERNS.GET_PROJECT_MEMBERS,
        { projectId, userId }
      )
    );
  }

  async addMember(addDto: AddProjectMemberDto, userId: string) {

    console.log("current user id in service: ", userId);

    return firstValueFrom(
      this.client.send(
        PROJECT_MEMBER_PATTERNS.ADD_PROJECT_MEMBER,
        { addDto, userId }
      )
    );
  }

  async updateMemberRole(updateDto: UpdateProjectMemberDto, userId: string) {
    return firstValueFrom(
      this.client.send(
        PROJECT_MEMBER_PATTERNS.UPDATE_PROJECT_MEMBER_ROLE,
        { ...updateDto, userId }
      )
    );
  }

  async removeMember(removeDto: RemoveProjectMemberDto, userId: string) {
    return firstValueFrom(
      this.client.send(
        PROJECT_MEMBER_PATTERNS.REMOVE_PROJECT_MEMBER,
        { ...removeDto, userId }
      )
    );
  }
}
