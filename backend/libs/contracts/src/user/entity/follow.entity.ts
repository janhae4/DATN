import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { User } from "./user.entity";

@Entity("follows")
export class Follow {
    @PrimaryColumn("uuid")
    followerId: string;

    @PrimaryColumn("uuid")
    followingId: string;

    @ManyToOne(() => User, (user) => user.following, { onDelete: 'CASCADE' })
    @JoinColumn({name: "followerId"})
    follower: User;

    @ManyToOne(() => User, (user) => user.followers, { onDelete: 'CASCADE' })
    @JoinColumn({name: "followingId"})
    following: User;

    @CreateDateColumn()
    createdAt: Date
}