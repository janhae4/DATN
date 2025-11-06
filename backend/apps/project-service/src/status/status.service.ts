import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStatusDto, UpdateStatusDto } from '@app/contracts';

@Injectable()
export class StatusService {
  constructor(private prisma: PrismaService) {}

  async create(createStatusDto: CreateStatusDto, userId: string) {
    const hasAccess = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: createStatusDto.projectId,
          userId,
        },
      },
    });

    if (!hasAccess) {
      throw new ForbiddenException('You do not have permission to create statuses for this project');
    }

    // Get the highest order value for this project
    const lastStatus = await this.prisma.status.findFirst({
      where: { projectId: createStatusDto.projectId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const newOrder = lastStatus ? lastStatus.order + 1 : 1;

    return this.prisma.status.create({
      data: {
        ...createStatusDto,
        order: newOrder,
      },
    });
  }

  async findAllByProject(projectId: string, userId: string) {
    // Verify user has access to the project
    const hasAccess = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this project');
    }

    return this.prisma.status.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const status = await this.prisma.status.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!status) {
      throw new NotFoundException(`Status with ID ${id} not found`);
    }

    if (status.project.members.length === 0) {
      throw new ForbiddenException('You do not have access to this status');
    }

    // Remove sensitive data before returning
    const { project, ...result } = status;
    return result;
  }

  async update(id: string, updateStatusDto: UpdateStatusDto, userId: string) {
    // First verify the status exists and user has access
    const status = await this.prisma.status.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!status) {
      throw new NotFoundException(`Status with ID ${id} not found`);
    }

    if (status.project.members.length === 0) {
      throw new ForbiddenException('You do not have permission to update this status');
    }

    // If updating order, we need to reorder other statuses
    if (updateStatusDto.order !== undefined && updateStatusDto.order !== status.order) {
      await this.reorderStatuses(status.projectId, id, updateStatusDto.order);
    }

    return this.prisma.status.update({
      where: { id },
      data: updateStatusDto,
    });
  }

  async remove(id: string, userId: string) {
    // First verify the status exists and user has access
    const status = await this.prisma.status.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: {
              where: {
                userId,
                role: 'OWNER',
              },
            },
          },
        },
      },
    });

    if (!status) {
      throw new NotFoundException(`Status with ID ${id} not found`);
    }

    // Only project owner can delete statuses
    if (status.project.members.length === 0) {
      throw new ForbiddenException('Only project owners can delete statuses');
    }

    // Find a fallback status (e.g., first available status)
    const fallbackStatus = await this.prisma.status.findFirst({
      where: {
        projectId: status.projectId,
        id: { not: id },
      },
      orderBy: { order: 'asc' },
    });

    // Update all tasks with this status to the fallback status
    if (fallbackStatus) {
      await this.prisma.task.updateMany({
        where: { statusId: id },
        data: { statusId: fallbackStatus.id },
      });
    }

    // Delete the status
    await this.prisma.status.delete({
      where: { id },
    });

    // Reorder remaining statuses
    await this.reorderStatusesAfterDeletion(status.projectId);

    return { success: true };
  }

  private async reorderStatuses(projectId: string, movedStatusId: string, newPosition: number) {
    // Get all statuses ordered by their current order
    const statuses = await this.prisma.status.findMany({
      where: { projectId, id: { not: movedStatusId } },
      orderBy: { order: 'asc' },
    });

    // Insert the moved status at the new position
    const updatedStatuses = [
      ...statuses.slice(0, newPosition - 1),
      { id: movedStatusId },
      ...statuses.slice(newPosition - 1),
    ];

    // Update all statuses with their new order
    await Promise.all(
      updatedStatuses.map((status, index) =>
        this.prisma.status.update({
          where: { id: status.id },
          data: { order: index + 1 },
        }),
      ),
    );
  }

  private async reorderStatusesAfterDeletion(projectId: string) {
    const statuses = await this.prisma.status.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    });

    await Promise.all(
      statuses.map((status, index) =>
        this.prisma.status.update({
          where: { id: status.id },
          data: { order: index + 1 },
        }),
      ),
    );
  }
}
