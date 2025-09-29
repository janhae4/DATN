import { Injectable } from '@nestjs/common';

@Injectable()
export class VideoServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
