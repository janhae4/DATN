import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

export enum Provider {
    LOCAL = 'LOCAL',
    GOOGLE = 'GOOGLE',
    FACEBOOK = 'FACEBOOK',
}

@Entity('accounts')
export class Account {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'enum', enum: Provider })
    provider: Provider;

    @Column()
    providerId: string;

    @Column({ nullable: true })
    password?: string;

    @Column({ nullable: true })
    accessToken?: string;

    @Column({ nullable: true })
    refreshToken?: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => User, (user) => user.accounts, { onDelete: 'CASCADE' })
    user: User;
}
