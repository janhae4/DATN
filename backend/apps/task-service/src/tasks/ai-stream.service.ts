import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

@Injectable()
export class AiStreamService {
    private streams = new Map<string, Subject<any>>();

    getOrCreateStream(userId: string): Subject<any> {
        let stream = this.streams.get(userId);
        if (!stream) {
            stream = new Subject<any>();
            this.streams.set(userId, stream);
        }
        return stream;
    }

    removeStream(userId: string) {
        const stream = this.streams.get(userId);
        if (stream) {
            stream.complete();
            this.streams.delete(userId);
        }
    }
}