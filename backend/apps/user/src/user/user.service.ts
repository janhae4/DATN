import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, EntityManager, FindManyOptions, In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  User,
  Account,
  CreateAuthLocalDto,
  CreateAuthOAuthDto,
  LoginDto,
  Provider,
  EVENTS_EXCHANGE,
  Follow,
  Role,
  ForbiddenException,
  RequestPaginationDto,
  TEAM_EXCHANGE,
  TEAM_PATTERN,
  Team,
  TeamMember,
  REDIS_EXCHANGE,
  REDIS_PATTERN,
  UserSkill,
  UserOnboardingDto,
  EVENTS,
} from '@app/contracts';
import { randomInt } from 'crypto';
import { RmqClientService } from '@app/common';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly MIN_WAIT_TIME_MS = 60 * 1000;
  private readonly EXPIRY_TIME_MS = 15 * 60 * 1000;
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    @InjectRepository(Follow)
    private readonly followRepo: Repository<Follow>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly amqp: RmqClientService
  ) { }

  private async create(createUserDto: Partial<User>) {
    this.logger.debug(
      `Creating a new user record with email: ${createUserDto.email}`,
    );
    const user = this.userRepo.create(createUserDto);
    return await this.userRepo.save(user);
  }

  async createLocal(createUserDto: CreateAuthLocalDto) {
    return await this.dataSource.transaction(async (manager) => {
      const { email, username } = createUserDto;
      this.logger.log(`Starting local user registration for email: ${email}`);

      const emailExistInUser = await manager.findOne(User, {
        where: { email },
      });

      if (emailExistInUser) {
        this.logger.warn(
          `Registration failed: Email ${email} already exists in User table.`,
        );
        throw new ConflictException('This email is already in use');
      }

      const emailExistInAccount = await manager.findOne(Account, {
        where: { email },
      });

      if (emailExistInAccount) {
        this.logger.warn(
          `Registration failed: Email ${email} already exists in Account table.`,
        );
        throw new ConflictException('This email is already in use');
      }

      const usernameExist = await manager.findOne(Account, {
        where: {
          provider: Provider.LOCAL,
          providerId: username,
        },
      });

      if (usernameExist) {
        this.logger.warn(
          `Registration failed: Username ${username} already exists.`,
        );
        throw new ConflictException('This username is already in use');
      }

      const verifiedCode = randomInt(100000, 999999).toString();
      const expiredCode = new Date(Date.now() + 15 * 60 * 1000);

      const savedUser = manager.create(User, {
        name: createUserDto.name,
        email: createUserDto.email,
        phone: createUserDto.phone,
        verifiedCode,
        expiredCode,
      });
      await manager.save(savedUser);

      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      const account = manager.create(Account, {
        provider: Provider.LOCAL,
        providerId: createUserDto.username,
        password: hashedPassword,
        user: savedUser,
        email: createUserDto.email,
      });
      await manager.save(account);

      this.logger.log(
        `Successfully created local user ${savedUser.id} and account for email: ${email}`,
      );
      return savedUser;
    });
  }

  async createAccount(partial: Partial<Account>) {
    this.logger.debug(
      `Creating a new account link for user ${partial.user?.id} with provider ${partial.provider}`,
    );

    console.log("user when linking account or creating account: ", partial)
    const account = this.accountRepo.create(partial);
    return await this.accountRepo.save(account);
  }

  async createOAuth(data: CreateAuthOAuthDto) {
    const { provider, email } = data;
    this.logger.log(
      `Starting OAuth registration for email: ${email} with provider: ${provider}`,
    );

    const user = await this.create({
      name: data.name ?? '',
      email: data.email ?? '',
      avatar: data.avatar ?? '',
      isVerified: true,
    });

    await this.createAccount({
      provider: data.provider,
      providerId: data.providerId,
      user,
    });

    this.logger.log(`Successfully created user ${user.id} via OAuth.`);
    return user;
  }

  async verifyLocal(userId: string, code: string) {
    this.logger.log(`Attempting to verify account for user ID: ${userId}`);
    const user = await this.findOne(userId);
    if (!user) {
      this.logger.warn(
        `Verification failed for user ${userId}: User not found.`,
      );
      throw new NotFoundException('User not found');
    }

    if (!user.verifiedCode) {
      this.logger.warn(
        `Verification failed for user ${userId}: Account already verified.`,
      );
      throw new BadRequestException('You have already verified your account');
    }

    if (user.verifiedCode !== code) {
      this.logger.warn(
        `Verification failed for user ${userId}: Invalid verification code provided.`,
      );
      throw new BadRequestException('Invalid verification code');
    }

    if (user.expiredCode && user.expiredCode < new Date()) {
      this.logger.warn(
        `Verification failed for user ${userId}: Verification code has expired.`,
      );
      throw new BadRequestException('Verification code expired');
    }

    await this.userRepo.update(user.id, {
      verifiedCode: null,
      expiredCode: null,
      isVerified: true,
    });

    this.logger.log(`Account for user ${userId} verified successfully.`);
    return { message: 'Account verified successfully' };
  }

  async verifyForgotPassword(userId: string, code: string, password: string) {
    this.logger.log(
      `Attempting to verify forgot password code for user ID: ${userId}`,
    );
    const user = await this.findOne(userId);
    if (!user) {
      this.logger.warn(
        `Forgot password verification failed for user ${userId}: User not found.`,
      );
      throw new NotFoundException('User not found');
    }

    if (!password) throw new BadRequestException('Password is required');

    if (!user.resetCode) {
      this.logger.warn(
        `Forgot password verification failed for user ${userId}: No reset code found.`,
      );
      throw new BadRequestException('Invalid verification code');
    }

    if (user.resetCode && user.resetCode !== code) {
      this.logger.warn(
        `Forgot password verification failed for user ${userId}: Invalid code provided.`,
      );
      throw new BadRequestException('Invalid verification code');
    }

    if (user.expiredCode && user.expiredCode < new Date()) {
      this.logger.warn(
        `Forgot password verification failed for user ${userId}: Code has expired.`,
      );
      throw new BadRequestException('Verification code expired');
    }

    const account = user?.accounts.find(
      (a) => a.provider === Provider.LOCAL,
    ) as Account;
    if (await bcrypt.compare(password, account.password ?? '')) {
      this.logger.warn(
        `Forgot password failed for user ${userId}: New password is the same as the old one.`,
      );
      throw new BadRequestException(
        'Password must be different from old password',
      );
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    await Promise.all([
      this.userRepo.update(user.id, {
        resetCode: null,
        expiredCode: null,
      }),
      this.accountRepo.update(account.id, {
        password: hashedPassword,
      }),
    ]);

    this.logger.log(
      `Password for user ${userId} has been changed successfully via forgot password flow.`,
    );
    return { message: 'Password changed successfully' };
  }

  async resetCode(userId: string, typeCode: 'verify' | 'reset') {
    return await this.dataSource.transaction(async (manager) => {
      this.logger.log(
        `Attempting to reset ${typeCode} code for user ID: ${userId}`,
      );
      const user = await manager.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        this.logger.warn(
          `Code reset failed for user ${userId}: User not found.`,
        );
        throw new NotFoundException('User not found');
      }
      if (user.isVerified && typeCode === 'verify') {
        this.logger.warn(
          `Code reset failed for user ${userId}: User already verified.`,
        );
        throw new BadRequestException('User already verified');
      }
      if (!user.resetCode && typeCode === 'reset') {
        this.logger.warn(
          `Code reset failed for user ${userId}: No reset code exists.`,
        );
        throw new BadRequestException('There is no reset code for this user');
      }
      if (user.expiredCode && user.expiredCode > new Date()) {
        this.logger.warn(
          `Code reset failed for user ${userId}: Code not expired yet.`,
        );
        throw new BadRequestException(
          `${typeCode === 'verify' ? 'Verification' : 'Reset'} code not expired`,
        );
      }

      const code = randomInt(100000, 999999).toString();
      const expiredCode = new Date(Date.now() + this.EXPIRY_TIME_MS);
      const updateData =
        typeCode === 'verify'
          ? { verifiedCode: code, expiredCode }
          : { resetCode: code, expiredCode };

      await manager.update(User, { id: userId }, updateData);
      this.logger.log(
        `Successfully generated new ${typeCode} code for user ${userId}`,
      );
      return { user, code, expiredCode };
    });
  }

  async findAll(query: FindManyOptions<User>): Promise<User[]> {
    this.logger.log('Fetching all users with provided query options.');
    return this.userRepo.find({ ...query, relations: ['accounts'] });
  }

  async findOne(id: string): Promise<User | null> {
    this.logger.log(`Finding user by ID: ${id}`);
    return await this.userRepo.findOne({
      where: { id },
      relations: ['accounts', 'skills'],
    });
  }

  async findOneWithAccounts(id: string): Promise<User | null> {
    this.logger.log(`Finding user with accounts by ID: ${id}`);
    return await this.userRepo.findOne({
      where: { id },
      relations: ['accounts'],
    });
  }

  async findOneOAuth(
    provider: Provider,
    providerId: string,
  ): Promise<Account | null> {
    this.logger.log(
      `Finding OAuth account by provider: ${provider} and providerId: ${providerId}`,
    );
    return await this.accountRepo.findOne({
      where: { provider, providerId },
      relations: ['user'],
    });
  }

  async findOneByEmail(email: string): Promise<User | null> {
    this.logger.log(`Finding user by email: ${email}`);
    return this.userRepo.findOne({ where: { email }, relations: ['accounts'] });
  }

  async findOneByEmailOrUserName(data: string): Promise<Account | null> {
    this.logger.log(`Finding account by email or username: ${data}`);
    return await this.accountRepo.findOne({
      where: [{ email: data }, { providerId: data, provider: Provider.LOCAL }],
      relations: ['user'],
    });
  }

  async findOneGoogle(email: string): Promise<Account | null> {
    this.logger.log(`Finding Google account by email: ${email}`);
    return await this.accountRepo.findOne({
      where: { provider: Provider.GOOGLE, user: { email } },
      relations: ['user'],
    });
  }

  async findOneWithPassword(id: string): Promise<Account | null> {
    this.logger.log(`Finding local account with password for user ID: ${id}`);
    return await this.accountRepo.findOne({
      where: { provider: Provider.LOCAL, user: { id } },
      relations: ['user'],
    });
  }

  async findManyByIds(ids: string[], forDiscussion?: boolean) {
    if (!ids || ids.length === 0) return [];

    const cachedUsers = await this.amqp.request<Partial<User>[]>({
      exchange: REDIS_EXCHANGE,
      routingKey: REDIS_PATTERN.GET_USER_INFO,
      payload: ids,
    })

    const cachedIds = new Set(cachedUsers.map(u => u.id));
    const missingIds = ids.filter(id => !cachedIds.has(id));
    let missingUsers: Partial<User>[] = [];

    if (missingIds.length > 0) {
      this.logger.log(`Cache miss for ${missingIds.length} users. Fetching from DB...`);
      missingUsers = await this.userRepo.find({
        where: {
          id: In(ids)
        },
        relations: {
          skills: true
        }
      });
      if (missingUsers.length > 0) {
        await this.amqp.publish(
          REDIS_EXCHANGE,
          REDIS_PATTERN.SET_MANY_USERS_INFO,
          missingUsers,
        )
      }
    }

    const allUsers = [...cachedUsers, ...missingUsers];
    this.logger.log(`Returning ${allUsers.length} users`);
    if (forDiscussion) {
      allUsers.forEach(user => {
        if (user.id !== undefined) {
          (user as any)._id = user.id;
          delete user.id;
        }
      })
      this.logger.log(`Returning ${allUsers.length} users for discussion`);
    }

    return allUsers;
  }

  async validate(loginDto: LoginDto) {
    this.logger.log(
      `Validating credentials for username: ${loginDto.username}`,
    );

    const account = await this.accountRepo.findOne({
      where: [
        { provider: Provider.LOCAL, providerId: loginDto.username },
        { provider: Provider.LOCAL, email: loginDto.username },
      ],
      relations: ['user'],
    });

    console.log(account);

    if (
      account &&
      (await bcrypt.compare(loginDto.password, account.password || ''))
    ) {
      this.logger.log(
        `Credentials validated successfully for user: ${account.user.id}`,
      );
      return account.user;
    }
    this.logger.warn(
      `Validation failed for username: ${loginDto.username}. Invalid credentials or user not found.`,
    );
    return null;
  }

  async resetPassword(email: string) {
    return await this.dataSource.transaction(async (manager) => {
      this.logger.log(`Initiating password reset for email/username: ${email}`);
      const user = await manager.findOne(User, {
        where: [
          { email },
          {
            accounts: {
              provider: Provider.LOCAL,
              providerId: email,
            },
          },
        ],
        relations: ['accounts'],
        lock: {
          mode: 'pessimistic_write',
          tables: ['users'],
        },
      });

      if (!user) {
        this.logger.warn(
          `Password reset failed: Account not found for identifier: ${email}`,
        );
        throw new NotFoundException('Account not found');
      }

      const account = user.accounts.find((a) => a.provider === Provider.LOCAL);
      if (!account) {
        this.logger.warn(
          `Password reset failed: Local account not found for user ${user.id}.`,
        );
        throw new NotFoundException('Local account not found');
      }

      const now = Date.now();
      const lastSentTime = user.expiredCode
        ? user.expiredCode.getTime() - this.EXPIRY_TIME_MS
        : 0;

      if (user.resetCode && now < lastSentTime + this.MIN_WAIT_TIME_MS) {
        const timeRemaining = Math.ceil(
          (lastSentTime + this.MIN_WAIT_TIME_MS - now) / 1000,
        );
        this.logger.warn(
          `Password reset failed for user ${user.id}: Request sent too soon.`,
        );
        throw new BadRequestException(
          `Reset code already sent! Please wait ${timeRemaining} seconds`,
        );
      }

      const resetCode = randomInt(100000, 1000000).toString();
      const expiredCode = new Date(now + this.EXPIRY_TIME_MS);

      await manager.update(
        User,
        { id: user.id },
        {
          resetCode,
          expiredCode,
        },
      );
      this.logger.log(
        `Password reset code generated and updated for user ${user.id}`,
      );
      return { user, resetCode, expiredCode };
    });
  }

  async confirmResetPassword(userId: string, code: string, password: string) {
    this.logger.log(`Confirming password reset for user ID: ${userId}`);
    const user = await this.findOne(userId);
    const account = user?.accounts.find((a) => a.provider === Provider.LOCAL);
    if (!account) {
      this.logger.warn(
        `Password reset confirmation failed: Account not found for user ${userId}.`,
      );
      throw new NotFoundException('Account not found');
    }
    if (user?.resetCode !== code) {
      this.logger.warn(
        `Password reset confirmation failed for user ${userId}: Invalid code.`,
      );
      throw new BadRequestException('Invalid code');
    }
    if (user.expiredCode && user.expiredCode < new Date()) {
      this.logger.warn(
        `Password reset confirmation failed for user ${userId}: Code expired.`,
      );
      throw new BadRequestException('Code expired');
    }

    if (await bcrypt.compare(password, account.password ?? '')) {
      this.logger.warn(
        `Password reset confirmation failed for user ${userId}: New password is the same as old one.`,
      );
      throw new BadRequestException(
        'Password must be different from old password',
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await Promise.all([
      this.userRepo.update(user.id, {
        resetCode: undefined,
        expiredCode: undefined,
      }),
      this.accountRepo.update(account.id, {
        password: hashedPassword,
      }),
    ]);
    this.logger.log(`Password reset confirmed and updated for user ${userId}`);
    return { message: 'Password has been successfully reset.' };
  }

  async updatePassword(id: string, oldPassword: string, newPassword: string) {
    return await this.dataSource.transaction(async (manager) => {
      this.logger.log(`Attempting to change password for user ID: ${id}`);
      if (oldPassword === newPassword) {
        this.logger.warn(
          `Password change failed for user ${id}: New password is the same as the old one.`,
        );
        throw new BadRequestException(
          'New password must be different from old password',
        );
      }

      const user = await manager.findOne(User, {
        where: { id },
        relations: ['accounts'],
        lock: {
          mode: 'pessimistic_write',
          tables: ['users'],
        },
      });
      if (!user) {
        this.logger.warn(`Password change failed: User ${id} not found.`);
        throw new NotFoundException('User not found');
      }
      const account = user.accounts.find((a) => a.provider === Provider.LOCAL);
      if (!account) {
        this.logger.warn(
          `Password change failed: Local account not found for user ${id}.`,
        );
        throw new NotFoundException('Local account not found');
      }

      if (!(await bcrypt.compare(oldPassword, account.password ?? ''))) {
        this.logger.warn(
          `Password change failed for user ${id}: Old password is incorrect.`,
        );
        throw new BadRequestException('Old password is incorrect');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await manager.update(
        Account,
        { id: account.id },
        { password: hashedPassword },
      );
      this.logger.log(`Password successfully updated for user ${id}`);
      return user;
    });
  }

  async update(id: string, data: Partial<User>) {
    this.logger.log(`Updating user data for ID: ${id}`);
    const isPublish = data.name || data.avatar;
    const result = await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set(data)
      .where('id = :id', { id })
      .returning('*')
      .execute();

    const rows = result.raw as User[];
    const user = rows[0] ?? null;

    this.logger.log(`Successfully updated user ${id}.`);
    if (user && isPublish) {
      const userUpdated = { id, name: user.name, avatar: user.avatar };
      this.amqp.publish(EVENTS_EXCHANGE, EVENTS.USER_UPDATED, userUpdated);
    } else {
      this.logger.warn(
        `Update operation did not return a user for ID: ${id}. It might not exist.`,
      );
    }

    return user;
  }

  async remove(id: string) {
    this.logger.log(`Removing user with ID: ${id}`);
    const result = await this.userRepo.delete(id);
    if (result.affected && result.affected > 0) {
      this.logger.log(`Successfully removed user ${id}.`);
    } else {
      this.logger.warn(
        `Remove operation had no effect. User with ID ${id} may not exist.`,
      );
    }
    return result;
  }

  async findByName(name: string, options: RequestPaginationDto, requesterId: string, teamId?: string) {
    this.logger.log(`Finding user by name or username or email: ${name}`);
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const searchTerm = `%${name}%`;

    let memberIds: string[] = [];
    if (teamId) {
      const team = await this.amqp.request<Team & { members: TeamMember[] }>({
        exchange: TEAM_EXCHANGE,
        routingKey: TEAM_PATTERN.FIND_BY_ID,
        payload: { id: teamId, userId: requesterId },
      });
      console.log(team);

      if (team && team.members) {
        memberIds = team.members.map(member => member.userId);
      } else {
        this.logger.warn(`Team ${teamId} not found or user ${requesterId} lacks access/permissions.`);
      }
    }

    const qb = this.userRepo.createQueryBuilder("user")
      .leftJoin(
        "user.accounts",
        "account",
        "account.provider = :provider",
        { provider: Provider.LOCAL }
      )
      .where(new Brackets(sqb => {
        sqb.where("user.name ILIKE :term", { term: searchTerm })
          .orWhere("user.email ILIKE :term", { term: searchTerm })
          .orWhere("account.providerId ILIKE :term", { term: searchTerm })
          .orWhere("account.email ILIKE :term", { term: searchTerm });
      }))
      .andWhere("user.id != :requesterId", { requesterId });

    if (teamId && memberIds.length > 0) {
      qb.andWhere("user.id NOT IN (:...memberIds)", { memberIds });
    }

    const userIdsWithExtra = await qb.clone()
      .select("DISTINCT user.id")
      .orderBy("user.id", "ASC")
      .skip(skip)
      .take(limit + 1)
      .getRawMany()
      .then(results => results.map(r => r.id as string));

    const hasNextPage = userIdsWithExtra.length > limit;
    const userIds = userIdsWithExtra.slice(0, limit);

    if (userIds.length === 0) {
      return { data: [], hasNextPage: false };
    }

    const data = await this.userRepo.createQueryBuilder("user")
      .leftJoin(
        "user.accounts",
        "account",
        "account.provider = :provider",
        { provider: Provider.LOCAL }
      )
      .where("user.id IN (:...userIds)", { userIds })
      .select([
        "user.id",
        "user.name",
        "user.email",
        "user.avatar",
        "account.providerId"
      ])
      .orderBy("user.id", "ASC")
      .getMany();

    return { data, hasNextPage };
  }

  async follow(requesterId: string, followingId: string) {
    this.logger.log(`Following user ${followingId} by ${requesterId}`);
    const follow = new Follow();
    follow.followerId = requesterId;
    follow.followingId = followingId;
    return await this.followRepo.save(follow);
  }

  async unfollow(requesterId: string, followingId: string) {
    this.logger.log(`Unfollowing user ${followingId} by ${requesterId}`);
    return await this.followRepo.delete({ followerId: requesterId, followingId });
  }

  async ban(userId: string) {
    const updateResult = await this.userRepo
      .createQueryBuilder()
      .update()
      .set({ isBan: true })
      .where('id = :userId', { userId })
      .andWhere('role != :adminRole', { adminRole: Role.ADMIN })
      .execute();

    if (updateResult.affected && updateResult.affected > 0) {
      return updateResult;
    }

    const userToBan = await this.userRepo.findOneBy({ id: userId });

    if (!userToBan) {
      throw new NotFoundException('User not found');
    }

    if (userToBan.role === Role.ADMIN) {
      throw new ForbiddenException('You cannot ban an admin');
    }

    throw new BadRequestException('User not found or not banable');
  }

  async unban(userId: string) {
    const updateResult = await this.userRepo
      .createQueryBuilder()
      .update()
      .set({ isBan: false })
      .where('id = :userId', { userId })
      .andWhere('role != :adminRole', { adminRole: Role.ADMIN })
      .execute();

    if (updateResult.affected && updateResult.affected > 0) {
      return updateResult;
    }

    const userToUnban = await this.userRepo.findOneBy({ id: userId });

    if (!userToUnban) {
      throw new NotFoundException('User not found');
    }

    if (userToUnban.role === Role.ADMIN) {
      throw new ForbiddenException('You cannot unban an admin');
    }

    throw new BadRequestException('User not found or not unbanable');
  }

  private async syncUserSkills(manager: EntityManager, userId: string, skillNames: string[]) {
    const currentSkills = await manager.find(UserSkill, { where: { user: { id: userId } } });
    const currentSkillNames = currentSkills.map(s => s.skillName.toLowerCase());

    const newSkillNames = skillNames.filter(name => !currentSkillNames.includes(name.toLowerCase()));

    if (newSkillNames.length > 0) {
      const newEntities = newSkillNames.map(name => manager.create(UserSkill, {
        user: { id: userId },
        skillName: name.toLowerCase(),
        isInterest: true
      }));
      await manager.save(newEntities);
    }

    const skillsToRemove = currentSkills.filter(s => !skillNames.includes(s.skillName));
    await manager.remove(skillsToRemove);
  }

  async onboarding(dto: UserOnboardingDto) {
    return await this.dataSource.transaction(async (manager) => {
      await manager.update(User, dto.userId, { jobTitle: dto.jobTitle });
      await this.syncUserSkills(manager, dto.userId, dto.interests);
    });
  }

  async updateSkills(userId: string, skills: string[]) {
    return await this.dataSource.transaction(async (manager) => {
      await this.syncUserSkills(manager, userId, skills);
    });
  }

  async getBulkUserSkill(userIds: string[]) {
    return await this.userRepo.find({
      where: { id: In(userIds) },
      select: {
        id: true,
        name: true,
        avatar: true
      },
      relations: {
        skills: true
      },
    })
  }

  async handleBulkSkillIncrement(data: Array<{ userId: string, skills: { skillName: string, exp: number }[] }>) {
    return await this.dataSource.transaction(async (manager) => {
      for (const { userId, skills } of data) {
        for (const { skillName, exp } of skills) {
          await this.increaseSkillExperience(manager, userId, skillName, exp);
        }
      }
      this.logger.log(`Updated skills for users: ${data.map(d => d.userId).join(', ')}`);
    });
  }

  async increaseSkillExperience(manager: EntityManager, userId: string, skillName: string, amount: number) {
    const normalizedName = skillName.trim().toLowerCase();
    console.log(`Processing: ${normalizedName} for User: ${userId}`);

    let userSkill = await manager.findOne(UserSkill, {
      where: {
        userId: userId,
        skillName: normalizedName
      },
    });

    if (!userSkill) {
      console.log('--> Creating New Skill');
      userSkill = manager.create(UserSkill, {
        userId: userId,
        skillName: normalizedName,
        experience: amount,
        level: 1,
        isInterest: true
      });
    } else {
      console.log('--> Updating Existing Skill');
      userSkill.experience += amount;
      userSkill.level = 1 + Math.floor(userSkill.experience / 100);
      userSkill.isInterest = false;
    }

    await manager.save(UserSkill, userSkill);

    const checkUser = await manager.findOne(User, {
      where: { id: userId },
      relations: ['skills']
    });

    console.log('Current Skills in Transaction:', checkUser?.skills);
  }
}
