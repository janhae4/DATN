import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  CreateProjectDto,
  UpdateProjectDto,
  PROJECT_PATTERNS,
  PROJECT_EXCHANGE, // <-- Nhớ import Exchange
} from '@app/contracts';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq'; // <-- Xài cái này
import { unwrapRpcResult } from '../common/helper/rpc'; // <-- Xài cái helper xịn xò này

@Injectable()
export class ProjectService { 
  constructor(
    private readonly amqpConnection: AmqpConnection, // Inject AmqpConnection
  ) {}

  // --- CREATE ---
  async create(createProjectDto: CreateProjectDto) {
    console.log("createProjectDto in API ne", createProjectDto);
    
    // Request kiểu RPC: gửi đi và đợi kết quả
    return unwrapRpcResult(await this.amqpConnection.request({
      exchange: PROJECT_EXCHANGE,
      routingKey: PROJECT_PATTERNS.CREATE,
      payload: createProjectDto,
    }));
  }

  // --- READ ---
  async findOne(id: string) {
    return unwrapRpcResult(await this.amqpConnection.request({
      exchange: PROJECT_EXCHANGE,
      routingKey: PROJECT_PATTERNS.GET_BY_ID,
      payload: { id },
    }));
  }

  // --- UPDATE ---
  async update(id: string, updateProjectDto: UpdateProjectDto) {
    return unwrapRpcResult(await this.amqpConnection.request({
      exchange: PROJECT_EXCHANGE,
      routingKey: PROJECT_PATTERNS.UPDATE,
      payload: { id, updateProjectDto },
    }));
  }

  // --- DELETE ---
  async remove(id: string) {
    return unwrapRpcResult(await this.amqpConnection.request({
      exchange: PROJECT_EXCHANGE,
      routingKey: PROJECT_PATTERNS.REMOVE,
      payload: { id },
    }));
  }
}