import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindManyOptions, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { LoginDto } from '@app/contracts/auth/login-request.dto';
import { User } from './entity/user.entity';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@app/contracts/errror';
import { CreateAuthOAuthDto } from '@app/contracts/auth/create-auth-oauth.dto';
import { Account, Provider } from './entity/account.entity';
import { CreateAuthLocalDto } from '@app/contracts/auth/create-auth-local.dto';
import { UserDto } from '@app/contracts/user/user.dto';
import { randomInt } from 'crypto';

@Injectable()
export class UserService {
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

  async registerLocal(createUserDto: CreateAuthLocalDto) {
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

      const account = manager.create(Account, {
        provider: Provider.LOCAL,
        providerId: createUserDto.username,
        password: bcrypt.hashSync(createUserDto.password, 10),
        user: savedUser,
      });
      await manager.save(account);

      return savedUser;
    });
  }

  async verifyLocal(userId: string, code: string) {
    const user = await this.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.verifiedCode && user.verifiedCode !== code) {
      console.log(user.verifiedCode, code);
      throw new BadRequestException('Invalid verification code');
    }

    if (user.expiredCode && user.expiredCode < new Date()) {
      throw new BadRequestException('Verification code expired');
    }

    user.isVerified = true;
    user.verifiedCode = undefined;
    user.expiredCode = undefined;
    return await this.userRepo.save(user);
  }

  async resetCode(userId: string) {
    return await this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) throw new NotFoundException('User not found');
      if (user.isVerified)
        throw new BadRequestException('User already verified');
      if (user.expiredCode && user.expiredCode > new Date()) {
        throw new BadRequestException('Verification code not expired');
      }

      user.verifiedCode = randomInt(100000, 999999).toString();
      user.expiredCode = new Date(Date.now() + 15 * 60 * 1000);
      await manager.save(user);
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

    console.log(account);

    if (
      account &&
      (await bcrypt.compare(loginDto.password, account.password || ''))
    ) {
      return account.user;
    }
    return null;
  }

  async updatePassword(id: string, password: string) {
    const result = await this.accountRepo.query<[[{ user: UserDto }], number]>(
      `
      UPDATE accounts SET password = $1 WHERE id = $2
      RETURNING (
        SELECT row_to_json(u)
        FROM "users" u
        WHERE u.id = accounts."userId"
      ) as user
      `,
      [password, id],
    );
    return result[0]?.[0]?.user;
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
