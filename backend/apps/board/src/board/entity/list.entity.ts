import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Unique
} from 'typeorm';
import { Board } from './board.entity';

@Entity({ name: 'lists' })
@Unique(['board', 'position'])
export class List {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255 })
    title: string;

    @Column({ type: 'real' })
    position: number;

    @Column({ default: false })
    isArchived: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @ManyToOne(() => Board, (board) => board.lists, {
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'board_id' })
    board: Board;
}