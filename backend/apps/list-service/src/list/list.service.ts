import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateListDto, ListCategoryEnum, UpdateListDto } from '@app/contracts';
import { List } from '@app/contracts/list/list/list.entity';

@Injectable()
export class ListService {
  constructor(
    @InjectRepository(List)
    private readonly listRepository: Repository<List>,
  ) { }

  async create(createListDto: CreateListDto): Promise<List> {
    const newList = this.listRepository.create(createListDto);
    return this.listRepository.save(newList);
  }

  async findAllByProject(projectId: string): Promise<List[]> {
    return this.listRepository.find({
      where: { projectId },
      order: { position: 'ASC' },
    });
  }

  async findAllByTeam(teamId: string): Promise<List[]> {
    return this.listRepository.find({
      where: { teamId },
      order: { position: 'ASC' },
    });
  }

  async findOne(id: string): Promise<List> {
    console.log('Finding list with ID:', id);
    const list = await this.listRepository.findOne({ where: { id } });
    console.log('Found list:', list);
    if (!list) {
      throw new NotFoundException(`List with ID ${id} not found`);
    }
    return list;
  }

  async update(id: string, updateListDto: UpdateListDto): Promise<List> {
    const list = await this.findOne(id);
    const updatedList = this.listRepository.merge(list, updateListDto);
    return this.listRepository.save(updatedList);
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const list = await this.findOne(id); 
    await this.listRepository.remove(list);
    return { success: true };
  }

  createDefaultLists(projectId: string) {
    const defaultLists: CreateListDto[] = [
      { name: 'To Do', projectId, position: 1 },
      {
        name: 'In Progress',
        projectId,
        position: 2,
        category: ListCategoryEnum.IN_PROGRESS,
      },
      { name: 'Done', projectId, position: 3, category: ListCategoryEnum.DONE },
    ];

    return Promise.all(defaultLists.map(this.create.bind(this)));
  }
}
