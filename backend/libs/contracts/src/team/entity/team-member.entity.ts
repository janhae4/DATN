import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { Team } from "./team.entity";
import { MemberRole } from "@app/contracts";

export enum MemberStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
    DECLINED = 'DECLINED',
    BANNED = 'BANNED',
    UNBANNED = 'UNBANNED',
    LEAVED = 'LEAVED'
}

@Entity()
@Unique(['teamId', 'userId'])
export class TeamMember {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Team, (team) => team.members, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'teamId' })
    team: Team;

    @Column()
    teamId: string;

    @Column()
    userId: string;

    @Column({
        type: 'enum',
        enum: MemberRole,
        default: MemberRole.MEMBER,
    })
    role: MemberRole;

    @Column({ default: true })
    isActive: boolean;

    @Column({
        type: 'enum',
        enum: MemberStatus,
        default: MemberStatus.PENDING
    })
    status: MemberStatus

    @CreateDateColumn({ nullable: true })
    joinedAt?: Date;

    @DeleteDateColumn()
    deletedAt?: Date | null;
}
