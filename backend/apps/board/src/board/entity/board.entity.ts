import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    Index
} from 'typeorm';
import { List } from './list.entity';

export enum BoardVisibility {
    PRIVATE = 'PRIVATE',
    TEAM = 'TEAM',
    PUBLIC = 'PUBLIC',
}

@Entity({ name: 'boards' })
export class Board {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({
        type: 'enum',
        enum: BoardVisibility,
        default: BoardVisibility.PRIVATE,
    })
    visibility: BoardVisibility;

    @Index()
    @Column({ type: 'uuid' })
    teamId: string;

    @Column({ name: 'background_image_url', length: 1024, nullable: true })
    backgroundImageUrl: string;

    @Column({ default: false })
    isArchived: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => List, (list) => list.board)
    lists: List[];
}