import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { User } from "./user.entity";

@Entity("follows")
export class Follow {
    @PrimaryColumn("uuid")
    followerId: string;

    @PrimaryColumn("uuid")
    followingId: string;

    @ManyToOne(() => User, (user) => user.following)
    @JoinColumn({name: "followerId"})
    follower: User;

    @ManyToOne(() => User, (user) => user.followers)
    @JoinColumn({name: "followingId"})
    following: User;

    @CreateDateColumn()
    createdAt: Date
}