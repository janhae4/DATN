import { ListCategoryEnum } from '@app/contracts/enums/list-category.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';


@Entity('lists')
export class List {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'real', nullable: false })
  position: number;

  @Column({ type: 'uuid', nullable: false })
  projectId: string;

  @Column({ type: 'uuid', nullable: true })
  teamId: string;

  @Column({ type: 'int', nullable: true })
  limited: number;

  @Column({
    type: 'enum',
    enum: ListCategoryEnum,
    default: ListCategoryEnum.TODO,
    nullable: false,
  })
  category: ListCategoryEnum;

  @Column({ type: 'boolean', default: false })
  isArchived: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'varchar' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'varchar' })
  updatedAt: Date;
}
