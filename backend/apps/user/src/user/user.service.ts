import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RpcException } from '@nestjs/microservices';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { LoginDto } from '@app/contracts/auth/login-request.dto';
import { CreateUserDto } from '@app/contracts/user/create-user.dto';
import { UpdateUserDto } from '@app/contracts/user/update-user.dto';
import { User } from './entity/user.entity';
import { ConflictException } from '@app/contracts/errror';
import { CreateAuthOAuthDto } from '@app/contracts/auth/create-auth-oauth';
import { Account, Provider } from './entity/account.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
  ) { }

  async registerLocal(createUserDto: CreateUserDto) {
    try {
      const existingAccount = await this.accountRepo.findOne({
        where: {
          provider: Provider.LOCAL,
          providerId: createUserDto.username,
        },
      });

      if (existingAccount) {
        throw new ConflictException('Username already exists');
      }

      const user = this.userRepo.create({
        name: createUserDto.name,
        email: createUserDto.email,
        phone: createUserDto.phone,
      });

      const savedUser = await this.userRepo.save(user);

      const account = this.accountRepo.create({
        provider: Provider.LOCAL,
        providerId: createUserDto.username,
        password: bcrypt.hashSync(createUserDto.password, 10),
        user: savedUser,
      });

      await this.accountRepo.save(account);
      return savedUser;
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException(error.detail || 'Account already exists');
      }
      throw new RpcException(error);
    }
  }

  async loginOAuth(data: CreateAuthOAuthDto) {
    let account = await this.accountRepo.findOne({
      where: {
        provider: data.provider,
        providerId: data.providerId,
      },
      relations: ['user'],
    });

    if (account) {
      account.accessToken = data.accessToken || account.accessToken;
      account.refreshToken = data.refreshToken || account.refreshToken;
      await this.accountRepo.save(account);
      return account.user;
    }

    const user = this.userRepo.create({
      name: data.name,
      email: data.email,
      avatar: data.avatar
    });
    const savedUser = await this.userRepo.save(user);

    const newAccount = this.accountRepo.create({
      provider: data.provider,
      providerId: data.providerId,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: savedUser,
    });
    await this.accountRepo.save(newAccount);

    return savedUser;
  }


  async findAll(query: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }): Promise<User[]> {
    const { skip, take, where, orderBy } = query;
    return this.userRepo.find({
      skip,
      take,
      where,
      order: orderBy,
    });
  }

  async findOne(where: any): Promise<User | null> {
    return this.userRepo.findOne({ where });
  }

  async validate(loginDto: LoginDto) {
    const account = await this.accountRepo.findOne({
      where: {
        provider: Provider.LOCAL,
        providerId: loginDto.username,
      },
      relations: ['user'],
    });

    if (account && await bcrypt.compare(loginDto.password, account?.password!)) {
      const { password, ...restAccount } = account;
      return restAccount as any;
    }

    return null;
  }

  async update(id: string, data: UpdateUserDto) {
    await this.userRepo.update(id, data);
    return this.userRepo.findOne({ where: { id } });
  }

  async remove(id: string) {
    return this.userRepo.delete(id);
  }
}
