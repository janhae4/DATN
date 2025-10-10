import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RpcException } from '@nestjs/microservices';
import { FindManyOptions, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { LoginDto } from '@app/contracts/auth/login-request.dto';
import { User } from './entity/user.entity';
import { ConflictException } from '@app/contracts/errror';
import { CreateAuthOAuthDto } from '@app/contracts/auth/create-auth-oauth';
import { Account, Provider } from './entity/account.entity';
import { PostgresError } from 'postgres';
import { CreateAuthLocalDto } from '@app/contracts/auth/create-auth-local';
import { UserDto } from '@app/contracts/user/user.dto';
import { Inject, forwardRef } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { GMAIL_CLIENT } from '@app/contracts/constants';
import { GMAIL_PATTERNS } from '@app/contracts/gmail/gmail.patterns';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User, 'USER_CONNECTION')
    private readonly userRepo: Repository<User>,
    @InjectRepository(Account, 'USER_CONNECTION')
    private readonly accountRepo: Repository<Account>,
    @Inject(GMAIL_CLIENT) private readonly gmailClient: ClientProxy,
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

      const verificationToken = this.generateVerificationToken();
      const savedUser = await this.create({
        name: createUserDto.name,
        email: createUserDto.email,
        phone: createUserDto.phone,
        emailVerified: false,
        verificationToken: verificationToken,
        verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });

      await this.createAccount({
        provider: Provider.LOCAL,
        providerId: createUserDto.username,
        password: bcrypt.hashSync(createUserDto.password, 10),
        user: savedUser,
      });

      // Send verification email
      try {
        await firstValueFrom(
          this.gmailClient.send(GMAIL_PATTERNS.SEND_VERIFICATION_EMAIL, {
            userId: savedUser.id,
            email: savedUser.email,
            verificationToken: savedUser.verificationToken,
          })
        );
        console.log('Verification email sent successfully');
      } catch (error) {
        console.error('Failed to send verification email:', error);
        // Don't fail registration if email fails, but log it
      }

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

  private generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async verifyEmail(token: string): Promise<User | null> {
    const user = await this.userRepo.findOne({
      where: {
        verificationToken: token,
        verificationTokenExpires: { $gt: new Date() } as any,
      },
    });

    if (!user) {
      throw new RpcException({
        status: 400,
        message: 'Invalid or expired verification token',
      });
    }

    user.emailVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;

    return await this.userRepo.save(user);
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
      emailVerified: true, // OAuth users are pre-verified
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

  async findOneByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
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
