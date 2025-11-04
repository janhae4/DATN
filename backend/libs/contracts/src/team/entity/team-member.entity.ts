import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { MemberRole } from "../dto/member.dto";
import { Team } from "./team.entity";

@Entity()
export class TeamMember {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Team, (team) => team.members, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'teamId' })
    team: Team;

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

    @CreateDateColumn()
    joinedAt: Date;
}
