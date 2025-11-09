import { Injectable } from '@nestjs/common';
import { CreateLabelDto, UpdateLabelDto } from '@app/contracts';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LabelsService {
  constructor(private prisma: PrismaService) {}

  create(createLabelDto: CreateLabelDto) {
    if (!createLabelDto) {
      throw new Error('CreateLabelDto is required');
    }
    if (!createLabelDto.name) {
      throw new Error('Label name is required');
    }
    if (!createLabelDto.projectId) {
      throw new Error('Project ID is required');
    }
    return this.prisma.label.create({
      data: {
        name: createLabelDto.name,
        projectId: createLabelDto.projectId,
        color: createLabelDto.color || '#EFE9E3',
      },
    });
  }

  findAllByProject(projectId: string) {
    return this.prisma.label.findMany({
      where: { projectId },
      orderBy: { name: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.label.findUnique({
      where: { id },
    });
  }

  update(id: string, updateLabelDto: UpdateLabelDto) {
    return this.prisma.label.update({
      where: { id },
      data: updateLabelDto,
    });
  }

  remove(id: string) {
    return this.prisma.label.delete({
      where: { id },
    });
  }
}
