import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSprintDto, UpdateSprintDto } from '@app/contracts'; // Sửa @app/contracts
import { SprintStatus, StatusEnum } from '@prisma/client'; // Import thêm StatusEnum

@Injectable()
export class SprintsService {
  constructor(private prisma: PrismaService) {}

  async create(createSprintDto: CreateSprintDto) {
    if (!createSprintDto.userId) {
      throw new ForbiddenException(
        'You do not have access to this project',
      );
    }
    const project = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: createSprintDto.projectId,
          userId: createSprintDto.userId,
        },
      },
    });

    if (!project) {
      throw new ForbiddenException(
        'You do not have access to this project',
      );
    }

    return this.prisma.sprint.create({
      data: {
        title: createSprintDto.title,
        goal: createSprintDto.goal,
        start_date: new Date(createSprintDto.start_date),
        end_date: new Date(createSprintDto.end_date),     
        projectId: createSprintDto.projectId,
        status: createSprintDto.status,
      },
    });
  }

  async findAllByProjectId(projectId: string) {
   

    return this.prisma.sprint.findMany({
      where: { projectId },
      orderBy: { start_date: 'desc' }, 
      include: {
        tasks: {
          include: {
            status: true,
            labels: true,
          },
        },
      },
    });
  }

  async findOneById(id: string, userId: string) {
    const sprint = await this.prisma.sprint.findUnique({
      where: { id },
      include: {
        tasks: {
          include: {
            status: true,
            labels: true,
          },
        },
        project: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!sprint) {
      throw new NotFoundException(`Sprint với ID ${id} không tìm thấy`);
    }

    if (sprint.project.members.length === 0) {
      throw new ForbiddenException('You do not have access to this sprint');
    }

    const { project, ...result } = sprint; 
    return result;
  }

  async update(id: string, updateSprintDto: UpdateSprintDto, userId: string) {
    const sprint = await this.prisma.sprint.findUnique({
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

    if (!sprint) {
      throw new NotFoundException(`Sprint với ID ${id} không tìm thấy`);
    }

    if (sprint.project.members.length === 0) {
      throw new ForbiddenException(
        'Bạn không có quyền cập nhật sprint này',
      );
    }

    if (updateSprintDto.status === SprintStatus.completed) {
      const doneStatus = await this.prisma.status.findFirst({
        where: {
          projectId: sprint.projectId,
          status: StatusEnum.done,
        },
      });

      if (doneStatus) {
        await this.prisma.task.updateMany({
          where: {
            sprintId: id,
            statusId: { not: doneStatus.id },
          },
          data: {
            statusId: doneStatus.id,
          },
        });
      }
    }

    const dataToUpdate: any = { ...updateSprintDto };
    if (updateSprintDto.start_date) {
      dataToUpdate.start_date = new Date(updateSprintDto.start_date);
    }
    if (updateSprintDto.end_date) {
      dataToUpdate.end_date = new Date(updateSprintDto.end_date);
    }

    return this.prisma.sprint.update({
      where: { id },
      data: dataToUpdate,
    });
  }

  async remove(id: string, userId: string) {
    const sprint = await this.prisma.sprint.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: {
              where: {
                userId,
                role: 'OWNER', // Giữ nguyên, giả định bạn có role 'OWNER'
              },
            },
          },
        },
      },
    });

    if (!sprint) {
      throw new NotFoundException(`Sprint với ID ${id} không tìm thấy`);
    }

    if (sprint.project.members.length === 0) {
      throw new ForbiddenException('Chỉ chủ dự án mới có quyền xóa sprints');
    }

    await this.prisma.task.updateMany({
      where: { sprintId: id },
      data: { sprintId: null },
    });
    return this.prisma.sprint.delete({
      where: { id },
    });
  }

  async getActiveSprint(projectId: string, userId: string) {
    const hasAccess = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (!hasAccess) {
      throw new ForbiddenException('Bạn không có quyền truy cập dự án này');
    }

    return this.prisma.sprint.findFirst({
      where: {
        projectId,
        status: SprintStatus.active,
      },
      include: {
        tasks: {
          include: {
            status: true,
            labels: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }

  async startSprint(id: string, userId: string) {
    const sprint = await this.prisma.sprint.findUnique({
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

    if (!sprint) {
      throw new NotFoundException(`Sprint với ID ${id} không tìm thấy`);
    }

    if (sprint.project.members.length === 0) {
      throw new ForbiddenException('Bạn không có quyền bắt đầu sprint này');
    }

    const activeSprint = await this.prisma.sprint.findFirst({
      where: {
        projectId: sprint.projectId,
        status: SprintStatus.active,
        id: { not: id },
      },
    });

    if (activeSprint) {
      throw new ForbiddenException(
        'Đã có một sprint đang hoạt động trong dự án này',
      );
    }

    await this.prisma.sprint.updateMany({
      where: {
        projectId: sprint.projectId,
        status: SprintStatus.active,
      },
      data: {
        status: SprintStatus.completed,
      },
    });

    return this.prisma.sprint.update({
      where: { id },
      data: {
        status: SprintStatus.active,
      },
    });
  }
}