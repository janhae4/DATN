import { Injectable, Logger } from '@nestjs/common'; // 1. Import Logger
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateTeamDto,
  MEMBER_ROLE,
  MemberDto,
  Team,
  ForbiddenException,
  NotFoundException,
} from '@app/contracts';

@Injectable()
export class TeamService {
  // 2. Instantiate the logger
  private readonly logger = new Logger(TeamService.name);

  constructor(@InjectRepository(Team) private teamRepo: Repository<Team>) { }

  async findAll() {
    this.logger.log('Fetching all teams.');
    return this.teamRepo.find();
  }

  async findByOwnerId(ownerId: string) {
    this.logger.log(`Finding team by owner ID: ${ownerId}`);
    const team = await this.teamRepo.findOne({ where: { ownerId } });
    if (!team) {
      this.logger.warn(`No team found for owner ID: ${ownerId}`);
      throw new NotFoundException('This user does not have any team');
    }
    return team;
  }

  async findById(id: string) {
    this.logger.log(`Finding team by ID: ${id}`);
    const team = await this.teamRepo.findOne({ where: { id } });
    if (!team) {
      this.logger.warn(`Team with ID ${id} not found.`);
      throw new NotFoundException("This team doesn't exist");
    }
    return team;
  }

  async create(createTeamDto: CreateTeamDto) {
    this.logger.log(
      `Creating a new team named "${createTeamDto.name}" for owner ${createTeamDto.ownerId}.`,
    );
    const newTeam = this.teamRepo.create({
      ownerId: createTeamDto.ownerId,
      name: createTeamDto.name,
      members: createTeamDto.members,
    });
    const savedTeam = await this.teamRepo.save(newTeam);
    this.logger.log(`Successfully created team with ID: ${savedTeam.id}.`);
    return savedTeam;
  }

  async addMember(teamId: string, member: MemberDto) {
    this.logger.log(`Adding member ${member.id} to team ${teamId}.`);
    const team = await this.findById(teamId);
    // This assumes MemberDto is a complete object.
    (team.members as MemberDto[]).push(member);
    const updatedTeam = await this.teamRepo.save(team);
    this.logger.log(`Successfully added member ${member.id} to team ${teamId}.`);
    return updatedTeam;
  }

  async removeMember(teamId: string, userId: string, requesterId: string) {
    this.logger.log(
      `Requester ${requesterId} attempting to remove user ${userId} from team ${teamId}.`,
    );
    const team = await this.findById(teamId);
    const members = team.members as MemberDto[];

    if (userId === team.ownerId) {
      this.logger.warn(
        `Failed removal attempt: User ${requesterId} tried to remove the team owner ${userId}.`,
      );
      throw new ForbiddenException('You cannot remove the owner');
    }

    const requester = members.find((m) => m.id === requesterId);

    if (!requester) {
      // This case should ideally not happen if the requester is authenticated and part of the team.
      this.logger.error(`Requester ${requesterId} not found in team ${teamId}'s members list.`);
      throw new ForbiddenException('Requester not found in team members');
    }

    const requesterRole = requester.role;

    if (![MEMBER_ROLE.ADMIN, MEMBER_ROLE.OWNER].includes(requesterRole)) {
      this.logger.warn(
        `Permission denied: Requester ${requesterId} with role ${requesterRole} attempted to remove a member.`,
      );
      throw new ForbiddenException('You do not have permission');
    }

    if (requesterRole === MEMBER_ROLE.ADMIN) {
      const target = members.find((m) => m.id === userId);
      if (target && target.role === MEMBER_ROLE.ADMIN) {
        this.logger.warn(
          `Permission denied: Admin ${requesterId} attempted to remove another admin ${userId}.`,
        );
        throw new ForbiddenException('Admin cannot remove another admin');
      }
    }

    team.members = members.filter((m) => m.id !== userId);
    this.logger.log(`Successfully removed user ${userId} from team ${teamId}.`);
    return this.teamRepo.save(team);
  }

  async changeRole(
    teamId: string,
    targetUserId: string,
    newRole: MEMBER_ROLE,
    requesterId: string,
  ) {
    this.logger.log(
      `Requester ${requesterId} attempting to change role of user ${targetUserId} to ${newRole} in team ${teamId}.`,
    );
    const team = await this.findById(teamId);
    const members = team.members as MemberDto[];

    if (team.ownerId !== requesterId) {
      this.logger.warn(
        `Permission denied: Non-owner ${requesterId} attempted to change a role in team ${teamId}.`,
      );
      throw new ForbiddenException('Only owner can change roles');
    }

    const member = members.find((m) => m.id === targetUserId);
    if (!member) {
      this.logger.warn(
        `Role change failed: Target user ${targetUserId} is not a member of team ${teamId}.`,
      );
      throw new NotFoundException('User is not a member of this team');
    }

    member.role = newRole;
    this.logger.log(
      `Successfully changed role of user ${targetUserId} to ${newRole} in team ${teamId}.`,
    );
    return this.teamRepo.save(team);
  }

  async promoteToAdmin(
    teamId: string,
    targetUserId: string,
    requesterId: string,
  ) {
    this.logger.log(
      `Processing promotion of user ${targetUserId} to ADMIN by requester ${requesterId} in team ${teamId}.`,
    );
    return this.changeRole(
      teamId,
      targetUserId,
      MEMBER_ROLE.ADMIN,
      requesterId,
    );
  }
}
