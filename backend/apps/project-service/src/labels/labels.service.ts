import { Injectable } from '@nestjs/common';
import { CreateLabelDto, UpdateLabelDto } from '@app/contracts';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LabelsService {
  constructor(private prisma: PrismaService) {}

  create(createLabelDto: CreateLabelDto, projectId: string) {
    return this.prisma.label.create({
      data: {
        ...createLabelDto,
        projectId,
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
