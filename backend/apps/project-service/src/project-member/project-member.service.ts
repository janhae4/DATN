import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ProjectRole } from '@prisma/client';
import { PrismaService } from 'apps/project-service/prisma/prisma.service';
import { AddProjectMemberDto } from '@app/contracts/project-member/add-project-member.dto';
import { UpdateProjectMemberDto } from '@app/contracts/project-member/update-project-member.dto';
import { RemoveProjectMemberDto } from '@app/contracts/project-member/remove-project-member.dto';
import { checkProjectAdminPermission } from '../utils/project-permission.util';

@Injectable()
export class ProjectMemberService {
    constructor(private prisma: PrismaService) { }

    // Permission checking is now handled by checkProjectAdminPermission utility

    /**
     * Get all members of a project
     */
    async getMembers(projectId: string, userId: string) {
        // 1. Check permission
        await checkProjectAdminPermission(this.prisma, projectId, userId);

        // 2. Get members
        return this.prisma.projectMember.findMany({
            where: { projectId }
        });
    }

    /**
     * Add a new member to the project
     */
    async addMember(addDto: AddProjectMemberDto, currentUserId: string) {
        console.log("current user in service: ", currentUserId);
        
        if (!addDto.memberId) {
            throw new Error('Member ID is required');
        }
        
        if (!addDto.projectId) {
            throw new Error('Project ID is required');
        }
        
        // 1. Check if current user has admin permission
        await checkProjectAdminPermission(this.prisma, addDto.projectId, currentUserId);
        
        // 2. Check if user is already a member of the project
        const existingMember = await this.prisma.projectMember.findUnique({
            where: {
                projectId_userId: { 
                    projectId: addDto.projectId, 
                    userId: addDto.memberId 
                },
            },
            select: {
                id: true,
                role: true
            }
        });

        if (existingMember) {
            console.log('User is already a member with role:', existingMember.role);
            throw new Error(`User ${addDto.memberId} is already a member of project ${addDto.projectId}`);
        }

        // 3. Add new member
        return this.prisma.projectMember.create({
            data: {
                projectId: addDto.projectId,
                userId: addDto.memberId,
                role: addDto.role || ProjectRole.MEMBER,
            }
        });
    }

    /**
     * Update member role
     */
    async updateMemberRole(updateDto: UpdateProjectMemberDto, currentUserId: string) {
        // 1. Check permission
        await checkProjectAdminPermission(this.prisma, updateDto.projectId, currentUserId);

        // 2. Update role
        return this.prisma.projectMember.update({
            where: {
                projectId_userId: {
                    projectId: updateDto.projectId,
                    userId: updateDto.memberId,
                },
            },
            data: {
                role: updateDto.role,
            }
        });
    }

    /**
     * Remove member from project
     */
    async removeMember(removeDto: RemoveProjectMemberDto, currentUserId: string) {
        // 1. Check permission
        await checkProjectAdminPermission(this.prisma, removeDto.projectId, currentUserId);

        // 2. Check if trying to remove OWNER
        const memberToRemove = await this.prisma.projectMember.findUnique({
            where: {
                projectId_userId: {
                    projectId: removeDto.projectId,
                    userId: removeDto.memberId,
                },
            },
        });

        if (!memberToRemove) {
            throw new NotFoundException('member not found');
        }

        if (memberToRemove.role === ProjectRole.OWNER) {
            throw new ForbiddenException('you cannot remove the owner of the project');
        }

        // 3. Remove member
        return this.prisma.projectMember.delete({
            where: {
                projectId_userId: {
                    projectId: removeDto.projectId,
                    userId: removeDto.memberId,
                },
            },
        });
    }
}
