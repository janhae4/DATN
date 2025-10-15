import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindManyOptions, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginDto } from '@app/contracts/auth/login-request.dto';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@app/contracts/errror';
import { CreateAuthOAuthDto } from '@app/contracts/auth/create-auth-oauth.dto';
import { CreateAuthLocalDto } from '@app/contracts/auth/create-auth-local.dto';
import { randomInt } from 'crypto';
import { User } from '@app/contracts/user/entity/user.entity';
import { Account } from '@app/contracts/user/entity/account.entity';
import { Provider } from '@app/contracts/user/account.dto';

@Injectable()
export class UserService {
  private readonly MIN_WAIT_TIME_MS = 60 * 1000;
  private readonly EXPIRY_TIME_MS = 15 * 60 * 1000;
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  private async create(createUserDto: Partial<User>) {
    const user = this.userRepo.create(createUserDto);
    return await this.userRepo.save(user);
  }

  async createLocal(createUserDto: CreateAuthLocalDto) {
    return await this.dataSource.transaction(async (manager) => {
      const { email, username } = createUserDto;

      const emailExistInUser = await manager.findOne(User, {
        where: { email },
      });

      if (emailExistInUser) {
        throw new ConflictException('This email is already in use');
      }

      const emailExistInAccount = await manager.findOne(Account, {
        where: { email },
      });

      if (emailExistInAccount) {
        throw new ConflictException('This email is already in use');
      }

      const usernameExist = await manager.findOne(Account, {
        where: {
          provider: Provider.LOCAL,
          providerId: username,
        },
      });

      if (usernameExist) {
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

      return savedUser;
    });
  }

  async createAccount(partial: Partial<Account>) {
    const account = this.accountRepo.create(partial);
    return await this.accountRepo.save(account);
  }

  async createOAuth(data: CreateAuthOAuthDto) {
    const { provider, providerId, email, name, avatar } = data;

    const user = await this.create({
      name: name ?? '',
      email: email ?? '',
      avatar: avatar ?? '',
      isVerified: true,
    });

    await this.createAccount({
      provider,
      providerId,
      user,
    });

    return user;
  }

  async verifyLocal(userId: string, code: string) {
    const user = await this.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.verifiedCode)
      throw new BadRequestException('You have already verified your account');

    if (user.verifiedCode !== code) {
      console.log(user.verifiedCode, code);
      throw new BadRequestException('Invalid verification code');
    }

    if (user.expiredCode && user.expiredCode < new Date()) {
      throw new BadRequestException('Verification code expired');
    }

    await this.userRepo.update(user.id, {
      verifiedCode: null,
      expiredCode: null,
      isVerified: true,
    });
    return { message: 'Account verified successfully' };
  }

  async verifyForgotPassword(userId: string, code: string, password: string) {
    const user = await this.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!password) throw new BadRequestException('Password is required');

    if (!user.resetCode)
      throw new BadRequestException('Invalid verification code');

    if (user.resetCode && user.resetCode !== code) {
      throw new BadRequestException('Invalid verification code');
    }

    if (user.expiredCode && user.expiredCode < new Date()) {
      throw new BadRequestException('Verification code expired');
    }

    const account = user?.accounts.find(
      (a) => a.provider === Provider.LOCAL,
    ) as Account;
    if (await bcrypt.compare(password, account.password ?? '')) {
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

    return { message: 'Password changed successfully' };
  }

  async resetCode(userId: string, typeCode: 'verify' | 'reset') {
    return await this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });

      console.log(typeCode === 'verify', typeCode === 'reset', typeCode);

      if (!user) throw new NotFoundException('User not found');
      if (user.isVerified && typeCode === 'verify')
        throw new BadRequestException('User already verified');
      if (!user.resetCode && typeCode === 'reset')
        throw new BadRequestException('There is no reset code for this user');
      if (user.expiredCode && user.expiredCode > new Date()) {
        throw new BadRequestException(
          `${typeCode === 'verify' ? 'Verification' : 'Reset'} code not expired`,
        );
      }

      console.log(user.resetCode);
      const code = randomInt(100000, 999999).toString();
      const expiredCode = new Date(Date.now() + this.EXPIRY_TIME_MS);
      const updateData =
        typeCode === 'verify'
          ? { verifiedCode: code, expiredCode }
          : { resetCode: code, expiredCode };

      await manager.update(User, { id: userId }, updateData);

      return { user, code, expiredCode };
    });
  }

  async findAll(query: FindManyOptions<User>): Promise<User[]> {
    return this.userRepo.find({ ...query, relations: ['accounts'] });
  }

  async findOne(id: string): Promise<User | null> {
    console.log(id);
    return await this.userRepo.findOne({
      where: { id },
      relations: ['accounts'],
    });
  }

  async findOneWithAccounts(id: string): Promise<User | null> {
    return await this.userRepo.findOne({
      where: { id },
      relations: ['accounts'],
    });
  }

  async findOneOAuth(
    provider: Provider,
    providerId: string,
  ): Promise<Account | null> {
    return await this.accountRepo.findOne({
      where: { provider, providerId },
      relations: ['user'],
    });
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email }, relations: ['accounts'] });
  }

  async findOneByEmailOrUserName(data: string): Promise<Account | null> {
    return await this.accountRepo.findOne({
      where: [{ email: data }, { providerId: data, provider: Provider.LOCAL }],
      relations: ['user'],
    });
  }

  async findOneGoogle(email: string): Promise<Account | null> {
    return await this.accountRepo.findOne({
      where: { provider: Provider.GOOGLE, user: { email } },
      relations: ['user'],
    });
  }

  async findOneWithPassword(id: string): Promise<Account | null> {
    return await this.accountRepo.findOne({
      where: { provider: Provider.LOCAL, user: { id } },
      relations: ['user'],
    });
  }

  async validate(loginDto: LoginDto) {
    const account = await this.accountRepo.findOne({
      where: {
        provider: Provider.LOCAL,
        providerId: loginDto.username,
      },
      relations: ['user'],
    });

    if (
      account &&
      (await bcrypt.compare(loginDto.password, account.password || ''))
    ) {
      return account.user;
    }
    return null;
  }

  async resetPassword(email: string) {
    return await this.dataSource.transaction(async (manager) => {
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
        throw new NotFoundException('Account not found');
      }

      const account = user.accounts.find((a) => a.provider === Provider.LOCAL);
      if (!account) {
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

      return { user, resetCode, expiredCode };
    });
  }

  async confirmResetPassword(userId: string, code: string, password: string) {
    const user = await this.findOne(userId);
    const account = user?.accounts.find((a) => a.provider === Provider.LOCAL);
    if (!account) throw new NotFoundException('Account not found');
    if (user?.resetCode !== code) throw new BadRequestException('Invalid code');
    if (user.expiredCode && user.expiredCode < new Date())
      throw new BadRequestException('Code expired');
    console.log(await bcrypt.compare(password, account.password ?? ''));
    if (await bcrypt.compare(password, account.password ?? ''))
      throw new BadRequestException(
        'Password must be different from old password',
      );
    const hashedPassword = await bcrypt.hash(password, 10);
    return await Promise.all([
      this.userRepo.update(user.id, {
        resetCode: undefined,
        expiredCode: undefined,
      }),
      this.accountRepo.update(account.id, {
        password: hashedPassword,
      }),
    ]);
  }

  async updatePassword(id: string, oldPassword: string, newPassword: string) {
    return await this.dataSource.transaction(async (manager) => {
      if (oldPassword === newPassword) {
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
        throw new NotFoundException('User not found');
      }
      const account = user.accounts.find((a) => a.provider === Provider.LOCAL);
      if (!account) {
        throw new NotFoundException('Local account not found');
      }

      if (!(await bcrypt.compare(oldPassword, account.password ?? ''))) {
        throw new BadRequestException('Old password is incorrect');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await manager.update(
        Account,
        { id: account.id },
        { password: hashedPassword },
      );
      return user;
    });
  }

  async update(id: string, data: Partial<User>) {
    const result = await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set(data)
      .where('id = :id', { id })
      .returning('*')
      .execute();

    const rows = result.raw as User[];
    const user = rows[0] ?? null;

    return user;
  }

  async remove(id: string) {
    return this.userRepo.delete(id);
  }
}
