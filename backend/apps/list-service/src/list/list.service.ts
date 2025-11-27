import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateListDto, UpdateListDto } from '@app/contracts';
import { List } from '@app/contracts/list/list/list.entity';

@Injectable()
export class ListService {
  constructor(
    @InjectRepository(List)
    private readonly listRepository: Repository<List>,
  ) {}

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

  async findOne(id: string): Promise<List> {
    const list = await this.listRepository.findOne({ where: { id } });
    if (!list) {
      throw new NotFoundException(`List with ID ${id} not found`);
    }
    return list;
  }

  async update(id: string, updateListDto: UpdateListDto): Promise<List> {
    const list = await this.findOne(id); // Ensures the list exists
    const updatedList = this.listRepository.merge(list, updateListDto);
    return this.listRepository.save(updatedList);
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const list = await this.findOne(id); // Ensures the list exists
    await this.listRepository.remove(list);
    return { success: true };
  }

  createDefaultLists(projectId: string) {
    const defaultLists: CreateListDto[] = [
      { name: 'To Do', projectId, position: 1 },
      { name: 'In Progress', projectId, position: 2 },
      { name: 'Done', projectId, position: 3 },
    ];

    return Promise.all(defaultLists.map(this.create.bind(this)));
  }

}
