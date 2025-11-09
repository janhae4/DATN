import { ForbiddenException } from '@nestjs/common';
import { ProjectRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export const checkProjectAdminPermission = async (
  prisma: PrismaService,
  projectId: string, 
  userId: string
): Promise<void> => {
  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId, userId },
    },
  });

  if (!member) {
    throw new ForbiddenException('you do not have access to this project');
  }

  if (member.role !== ProjectRole.ADMIN && member.role !== ProjectRole.OWNER) {
    throw new ForbiddenException('only ADMIN or OWNER can perform this action');
  }
};
