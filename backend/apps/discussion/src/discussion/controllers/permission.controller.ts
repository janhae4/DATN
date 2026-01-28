import { Controller } from '@nestjs/common';
import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { DISCUSSION_EXCHANGE, DISCUSSION_PATTERN } from '@app/contracts';
import { PermissionService } from '../services/permission.service';
import { customErrorHandler } from '@app/common';

@Controller()
export class PermissionController {
    constructor(private readonly permissionService: PermissionService) { }

    @RabbitRPC({
        exchange: DISCUSSION_EXCHANGE,
        routingKey: DISCUSSION_PATTERN.UPDATE_PERMISSION,
        queue: DISCUSSION_PATTERN.UPDATE_PERMISSION,
        errorHandler: customErrorHandler,
    })
    async handleUpdatePermission(payload: { discussionId: string; requesterId: string; override: any }) {
        return await this.permissionService.updatePermission(payload);
    }
}
