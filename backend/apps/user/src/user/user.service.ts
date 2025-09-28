import { HttpStatus, Injectable } from '@nestjs/common';

import bcrypt from 'bcrypt';
import { LoginDto } from '@app/contracts/auth/login-request.dto';
import { CreateUserDto } from '@app/contracts/user/create-user.dto';
import { UpdateUserDto } from '@app/contracts/user/update-user.dto';
import { PrismaService } from './prisma.service';
import { Prisma, User } from '../generated/prisma';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}
  async create(createUserDto: CreateUserDto): Promise<any> {
    try {
      return await this.prisma.user.create({
        data: {
          username: createUserDto.username,
          email: createUserDto.email,
          password: bcrypt.hashSync(createUserDto.password, 10),
          name: createUserDto.name,
          phone: createUserDto.phone,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new RpcException({
            error: `${error.meta?.target?.[0] || 'Account'} already exists`,
            status: HttpStatus.BAD_REQUEST,
          });
        }
      }
      throw new RpcException(error);
    }
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserWhereUniqueInput;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<User[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.user.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async findOne(id: Prisma.UserWhereUniqueInput): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: id,
    });
  }

  async validate(loginDto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: loginDto.username }, { email: loginDto.username }],
      },
    });
    if (user && (await bcrypt.compare(loginDto.password, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _password, ...result } = user;
      return result;
    }
    return null;
  }

  async update(where: Prisma.UserWhereUniqueInput, data: UpdateUserDto) {
    return this.prisma.user.update({
      where,
      data,
    });
  }

  async remove(where: Prisma.UserWhereUniqueInput) {
    return this.prisma.user.delete({
      where,
    });
  }
}
