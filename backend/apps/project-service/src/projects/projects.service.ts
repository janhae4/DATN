import { Injectable } from '@nestjs/common';
import { CreateProjectDto, UpdateProjectDto } from '@app/contracts';
import { defaultStatuses } from './constants/default-statuses';
import { PrismaService } from 'apps/project-service/prisma/prisma.service';
import { ProjectRole } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) { }

  // --- CREATE ---
  async create(createProjectDto: CreateProjectDto) {
    const { memberIds, ownerId, ...restOfDto } = createProjectDto;


    const membersToCreate = (memberIds || [])
      .map((id) => ({
        userId: id,
        role: ProjectRole.MEMBER
      }))

    if (!ownerId) {
      throw new Error('Owner ID is required');
    }

    const project = await this.prisma.project.create({
      data: {
        ...restOfDto,
        ownerId,
        statuses: {
          createMany: {
            data: defaultStatuses.map((status, index) => ({
              ...status,
              order: index,
            })),
          },
        },

        members: {
          createMany: {
            data: membersToCreate,
          },
        },
      },
      include: {
        members: true,
      },
    });
    return project;
  }

  // --- READ ---
  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });
    if (!project) {
      throw new Error('Project not found'); // Sẽ được customErrorHandler bắt
    }
    return project;
  }

  // --- UPDATE ---
  async update(id: string, updateProjectDto: UpdateProjectDto) {
    const project = await this.prisma.project.update({
      where: { id },
      data: updateProjectDto,
    });
    return project;
  }

  // --- DELETE ---
  async remove(id: string) {
    await this.prisma.project.delete({
      where: { id },
    });
    return { message: 'Project deleted successfully' };
  }
}