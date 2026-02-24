import { Serializer, OutgoingRequest } from '@nestjs/microservices';
import { ClsService } from 'nestjs-cls';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TracingSerializer implements Serializer {
  constructor(private readonly cls: ClsService) {}

  serialize(value: any): OutgoingRequest {
    const traceId = this.cls.getId(); 
    return {
      ...value,
      __traceId: traceId,
    };
  }
}