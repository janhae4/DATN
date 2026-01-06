import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { User } from "./user.entity";

@Entity()
@Unique(['user', 'skillName'])
export class UserSkill {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @ManyToOne(() => User, (user) => user.skills)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    skillName: string;

    @Column({ type: 'float', default: 1.0 })
    level: number;

    @Column({ default: 0 })
    experience: number;

    @Column({ default: false })
    isInterest: boolean;
}