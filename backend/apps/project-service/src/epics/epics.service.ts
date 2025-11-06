import { Injectable } from '@nestjs/common';
import { CreateEpicDto, UpdateEpicDto } from '@app/contracts';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EpicsService {
  constructor(private prisma: PrismaService) {}

  create(createEpicDto: CreateEpicDto, ownerId: string) {
    return this.prisma.epic.create({
      data: {
        ...createEpicDto,
        ownerId: ownerId,
      },
    });
  }

  findAllByProject(projectId: string) {
    return this.prisma.epic.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(epicId: string) {
    return this.prisma.epic.findUnique({
      where: { id: epicId },
      include: {
        tasks: true,
      },
    });
  }

  update(epicId: string, updateEpicDto: UpdateEpicDto) {
    return this.prisma.epic.update({
      where: { id: epicId },
      data: updateEpicDto,
    });
  }

  remove(epicId: string) {
    return this.prisma.epic.delete({
      where: { id: epicId },
    });
  }
}
