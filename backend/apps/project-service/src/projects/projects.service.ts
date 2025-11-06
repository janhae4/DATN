import { Inject, Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { CreateProjectDto, UpdateProjectDto, ProjectPatterns, NOTIFICATION_PATTERN } from '@app/contracts'; // Sửa @app/contracts thành @contracts
import { PrismaService } from '../../prisma/prisma.service';
import { ClientProxy } from '@nestjs/microservices';
import { StatusService } from '../status/status.service';
import { defaultStatuses } from './constants/default-statuses'; // File này tôi đã tạo ở lần trước
import { firstValueFrom } from 'rxjs';
import { TEAM_PATTERN } from '@app/contracts/team/team.pattern';

@Injectable()
export class ProjectsService implements OnModuleInit {
    constructor(
        private prisma: PrismaService,
        private statusService: StatusService,
        @Inject('TEAM_SERVICE_CLIENT')
        private teamClient: ClientProxy,
        @Inject('NOTIFICATION_SERVICE_CLIENT')
        private notificationClient: ClientProxy,
    ) { }

    async onModuleInit() {
        // Kết nối tất cả client
        await Promise.all([
            this.teamClient.connect(),
            this.notificationClient.connect(),
        ]);
    }

    /**
     * 1. HÀM CREATE (Đã sửa)
     * - Chỉ tạo Project.
     * - Gửi event cho team-service để tự thêm member.
     */
    async create(createProjectDto: CreateProjectDto, ownerId: string) {
        // DTO từ contracts không nên có 'memberIds' ở hàm create
        // Nó nên được xử lý ở endpoint khác (ví dụ: invite)
        // Nhưng nếu vẫn muốn giữ, ta sẽ làm thế này:
        const { memberIds = [], ...rest } = createProjectDto;

        // 1. Tạo project
        const project = await this.prisma.project.create({
            data: {
                ...rest,
                ownerId,
            },
        });

        // 2. Tạo các cột status mặc định
        // (Giữ nguyên logic gọi statusService của bạn)
        await Promise.all(
            defaultStatuses.map(status =>
                this.statusService.create({ ...status, projectId: project.id }, ownerId),
            ),
        );

        // 3. Gửi Event (fire-and-forget) đến team-service
        // để tự động thêm owner làm ADMIN (hoặc OWNER)
        this.teamClient.emit(TEAM_PATTERN.ADD_MEMBER, {
            projectId: project.id,
            userId: ownerId,
            role: 'ADMIN', // Hoặc 'OWNER' tùy logic của team-service
        });

        // 4. Mời các member khác (nếu có)
        const allMemberIds = [ownerId, ...memberIds.filter(id => id !== ownerId)];

        // Gửi event mời member
        this.teamClient.emit(TEAM_PATTERN.ADD_MEMBER, {
            projectId: project.id,
            memberIds: allMemberIds,
            invitedById: ownerId,
        });

        // 5. Gửi thông báo
        this.notificationClient.emit(NOTIFICATION_PATTERN.PROJECT_INVITATION, {
            projectId: project.id,
            projectName: project.name,
            memberIds: allMemberIds,
            invitedById: ownerId,
        });

        return project;
    }

    /**
     * 2. HÀM FIND ALL BY USER (Đã sửa)
     * - Hỏi team-service xem user này được tham gia project nào.
     * - Lấy các project đó từ CSDL của mình.
     */
    async findAllByUser(userId: string) {
        // 1. Gọi team-service (Request-Response)
        const projectIds: string[] = await firstValueFrom(
            this.teamClient.send(TEAM_PATTERN.FIND_BY_USER_ID, { userId }),
        );

        if (!projectIds || projectIds.length === 0) {
            return [];
        }

        // 2. Lấy project từ CSDL của project-service
        return this.prisma.project.findMany({
            where: {
                id: {
                    in: projectIds,
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    /**
     * 3. HÀM FIND ONE (Đã sửa)
     * - Hàm này chỉ có 1 nhiệm vụ: lấy data project.
     * - Việc kiểm tra "userId" có quyền xem hay không
     * thuộc về API GATEWAY (nó sẽ gọi team-service để check).
     */
    async findOne(projectId: string) {
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            include: {
                statuses: { orderBy: { order: 'asc' } },
                labels: true,
                sprints: true,
                epics: true,
                // Không include tasks, sẽ load riêng
            },
        });

        if (!project) {
            throw new NotFoundException('Không tìm thấy dự án.');
        }
        return project;
    }

    /**
     * 4. HÀM UPDATE (Đã sửa)
     * - Chỉ update data của Project.
     * - Việc update member là event gửi cho team-service.
     * - Logic check quyền (OWNER) phải ở API GATEWAY.
     */
    async update(projectId: string, updateProjectDto: UpdateProjectDto) {
        const { memberIds, ...rest } = updateProjectDto;

        // 1. Update data của project (name, description...)
        const updatedProject = await this.prisma.project.update({
            where: { id: projectId },
            data: rest,
        });

        // 2. Nếu có 'memberIds', gửi event cho team-service
        if (memberIds) {
            this.teamClient.emit(TEAM_PATTERN.ADD_MEMBER, {
                projectId: projectId,
                memberIds: memberIds,
                // Có thể thêm "updatedById: userId" nếu Gateway gửi
            });

            // Bạn cũng có thể gửi notification tại đây
        }

        return updatedProject;
    }

    /**
     * 5. HÀM REMOVE (Đã sửa)
     * - Chỉ xóa Project.
     * - Gửi event để các service khác tự dọn dẹp.
     * - Logic check quyền (OWNER) phải ở API GATEWAY.
     */
    async remove(projectId: string) {
        // 1. Xóa project (Prisma sẽ xóa
        //    tất cả task, sprint...)
        const deletedProject = await this.prisma.project.delete({
            where: { id: projectId },
        });

        // 2. Gửi event cho team-service để nó tự xóa hết member
        this.teamClient.emit(TEAM_PATTERN.REMOVE_TEAM, { projectId });

        return deletedProject;
    }
}