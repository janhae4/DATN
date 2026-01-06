import { Controller, Get } from '@nestjs/common';
import { TestingServiceService } from './testing-service.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class TestingServiceController {
  constructor(private readonly testingServiceService: TestingServiceService) {}

 
  @MessagePattern("hello")
  getHello(body: any) {
    console.log("hello from service")
    return body;
  }
}
