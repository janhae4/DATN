import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from '../../../../libs/contracts/src/team/team.entity';
import { CreateTeamDto } from '../../../../libs/contracts/src/team/create-team.dto';
import {
    MEMBER_ROLE,
    MemberDto,
} from '../../../../libs/contracts/src/team/member.dto';
import { ForbiddenException, NotFoundException } from '@app/contracts/errror';

@Injectable()
export class TeamService {
    constructor(@InjectRepository(Team) private teamRepo: Repository<Team>) { }

    async findAll() {
        return this.teamRepo.find();
    }

    async findByOwnerId(ownerId: string) {
        const team = await this.teamRepo.findOne({ where: { ownerId } });
        if (!team) throw new NotFoundException('This user dont have any team');
        return team;
    }

    async findById(id: string) {
        const team = await this.teamRepo.findOne({ where: { id } });
        if (!team) throw new NotFoundException("This team doesn't exist");
        return team;
    }

    async create(createTeamDto: CreateTeamDto) {
        const newTeam = this.teamRepo.create({
            ownerId: createTeamDto.ownerId,
            name: createTeamDto.name,
            members: createTeamDto.members,
        });
        return this.teamRepo.save(newTeam);
    }

    async addMember(teamId: string, member: MemberDto) {
        const team = await this.findById(teamId);
        team.members.push(member);
        return this.teamRepo.save(team);
    }

    async removeMember(teamId: string, userId: string, requesterId: string) {
        const team = await this.findById(teamId);

        if (userId === team.ownerId) {
            throw new ForbiddenException('You cannot remove the owner');
        }

        const requesterRole = team.members.find((m) => m.id === requesterId)?.role;

        if (
            !requesterRole ||
            ![MEMBER_ROLE.ADMIN, MEMBER_ROLE.OWNER].includes(requesterRole)
        ) {
            throw new ForbiddenException('You do not have permission');
        }

        if (requesterRole === MEMBER_ROLE.ADMIN) {
            const targetRole = team.members.find((m) => m.id === userId)?.role;
            if (targetRole === MEMBER_ROLE.ADMIN) {
                throw new ForbiddenException('Admin cannot remove another admin');
            }
        }

        team.members = team.members.filter((m) => m.id !== userId);
        return this.teamRepo.save(team);
    }

    async changeRole(
        teamId: string,
        targetUserId: string,
        newRole: MEMBER_ROLE,
        requesterId: string,
    ) {
        const team = await this.findById(teamId);

        if (team.ownerId !== requesterId) {
            throw new ForbiddenException('Only owner can change roles');
        }

        const member = team.members.find((m) => m.id === targetUserId);
        if (!member) {
            throw new NotFoundException('User is not a member of this team');
        }

        member.role = newRole;
        return this.teamRepo.save(team);
    }

    async promoteToAdmin(
        teamId: string,
        targetUserId: string,
        requesterId: string,
    ) {
        return this.changeRole(
            teamId,
            targetUserId,
            MEMBER_ROLE.ADMIN,
            requesterId,
        );
    }
}
