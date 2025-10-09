import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RpcException } from '@nestjs/microservices';
import { FindManyOptions, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { LoginDto } from '@app/contracts/auth/login-request.dto';
import { User } from './entity/user.entity';
import { ConflictException } from '@app/contracts/errror';
import { CreateAuthOAuthDto } from '@app/contracts/auth/create-auth-oauth';
import { Account, Provider } from './entity/account.entity';
import { PostgresError } from 'postgres';
import { CreateAuthLocalDto } from '@app/contracts/auth/create-auth-local';
import { UserDto } from '@app/contracts/user/user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User, 'USER_CONNECTION')
    private readonly userRepo: Repository<User>,
    @InjectRepository(Account, 'USER_CONNECTION')
    private readonly accountRepo: Repository<Account>,
  ) {}

  private async create(createUserDto: Partial<User>) {
    const user = this.userRepo.create(createUserDto);
    return await this.userRepo.save(user);
  }

  async registerLocal(createUserDto: CreateAuthLocalDto) {
    try {
      const existingAccount = await this.accountRepo.findOne({
        where: {
          provider: Provider.LOCAL,
          providerId: createUserDto.username,
        },
      });

      if (existingAccount) {
        throw new ConflictException('Email already exists');
      }

      const savedUser = await this.create({
        name: createUserDto.name,
        email: createUserDto.email,
        phone: createUserDto.phone,
      });

      this.createAccount({
        provider: Provider.LOCAL,
        providerId: createUserDto.username,
        password: bcrypt.hashSync(createUserDto.password, 10),
        user: savedUser,
      });

      return savedUser;
    } catch (e) {
      const error = e as PostgresError;
      if (error.code === '23505') {
        throw new ConflictException(
          (error?.detail as string) || 'Account already exists',
        );
      }
      if (error instanceof RpcException) {
        throw error;
      }

      throw new RpcException({
        status: 500,
        message: 'Internal server error',
      });
    }
  }

  private async createAccount(partial: Partial<Account>) {
    const account = this.accountRepo.create(partial);
    return await this.accountRepo.save(account);
  }

  async createOAuth(data: CreateAuthOAuthDto) {
    const { provider, providerId, email, name, avatar } = data;

    const user = await this.create({
      name: name ?? '',
      email: email ?? '',
      avatar: avatar ?? '',
    });

    this.createAccount({
      provider,
      providerId,
      user,
    });

    return user;
  }

  async findAll(query: FindManyOptions<User>): Promise<User[]> {
    return this.userRepo.find(query);
  }

  async findOne(id: string): Promise<User | null> {
    return await this.userRepo.findOne({ where: { id } });
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
