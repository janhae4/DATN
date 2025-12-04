import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, EntityManager, In } from 'typeorm';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { unwrapRpcResult } from '@app/common';
import {
    Board,
    List,
    MemberRole,
    USER_PATTERNS,
    EVENTS,
    NotFoundException,
    ForbiddenException,
    EventUserSnapshot,
    USER_EXCHANGE,
    EVENTS_EXCHANGE,
    TEAM_PATTERN,
    TEAM_EXCHANGE,
    CreateBoardDto,
    BoardCreatedEventPayload,
    CreateListDto,
    ListCreatedEventPayload,
    MoveListDto,
    ListMovedEventPayload,
    BoardSnapshot,
    ListSnapshot,
    UpdateListDto,
    ListUpdatedEventPayload,
} from '@app/contracts';

@Injectable()
export class BoardService {
    private readonly logger = new Logger(BoardService.name);

    constructor(
        @InjectRepository(Board)
        private boardRepo: Repository<Board>,
        @InjectRepository(List)
        private listRepo: Repository<List>,
        private readonly amqp: AmqpConnection,
        @InjectDataSource()
        private readonly dataSource: DataSource,
    ) { }

    private async _getUserProfile(
        userId: string,
    ): Promise<EventUserSnapshot | null> {
        try {
            const amqp = await this.amqp.request<EventUserSnapshot>({
                exchange: USER_EXCHANGE,
                routingKey: USER_PATTERNS.FIND_ONE,
                payload: userId,
                timeout: 2000,
            });
            const profile = unwrapRpcResult(amqp);
            return profile;
        } catch (error) {
            this.logger.warn(
                `Failed to fetch user profile ${userId} from cache: ${error.message}`,
            );
            return null;
        }
    }


    private async _verifyBoardAccess(
        requesterId: string,
        boardId: string,
        allowedRoles: MemberRole[],
        manager: EntityManager,
    ): Promise<Board> {
        const board = await manager.findOne(Board, {
            where: { id: boardId },
            lock: { mode: 'pessimistic_write' },
        });

        if (!board) {
            throw new NotFoundException(`Board with ID ${boardId} not found.`);
        }

        try {
            const rpcResult = await this.amqp.request({
                exchange: TEAM_EXCHANGE,
                routingKey: TEAM_PATTERN.VERIFY_PERMISSION,
                payload: {
                    userId: requesterId,
                    teamId: board.teamId,
                    roles: allowedRoles,
                },
                timeout: 3000,
            });

            unwrapRpcResult(rpcResult);

            return board;
        } catch (error) {
            this.logger.warn(
                `Permission check failed for user ${requesterId} on board ${boardId}: ${error.message}`,
            );
            if (error instanceof ForbiddenException) {
                throw error;
            }
            throw new ForbiddenException(
                'You do not have permission to access this board.',
            );
        }
    }


    async create(
        createBoardDto: CreateBoardDto,
        requesterId: string,
    ): Promise<Board> {
        const { name, teamId, visibility } = createBoardDto;
        this.logger.log(`User ${requesterId} creating board "${name}" in team ${teamId}`);

        try {
            const rpcResult = await this.amqp.request({
                exchange: TEAM_EXCHANGE,
                routingKey: TEAM_PATTERN.VERIFY_PERMISSION,
                payload: {
                    userId: requesterId,
                    teamId: teamId,
                    roles: [MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER], // Ai cũng có thể tạo board
                },
                timeout: 3000,
            });
            unwrapRpcResult(rpcResult);
        } catch (error) {
            this.logger.error(`Failed permission check for creating board: ${error.message}`);
            throw new ForbiddenException(
                'You must be a member of the team to create a board.',
            );
        }

        const requesterProfile = await this._getUserProfile(requesterId);

        const newBoard = await this.dataSource.transaction(async (manager) => {
            const boardRepo = manager.getRepository(Board);
            const listRepo = manager.getRepository(List);

            const board = boardRepo.create({
                name,
                teamId,
                visibility,
            });
            const savedBoard = await boardRepo.save(board);

            const defaultListsData = [
                { title: 'To Do', position: 1 },
                { title: 'In Progress', position: 2 },
                { title: 'Done', position: 3 },
            ];

            const defaultLists = defaultListsData.map((list) =>
                listRepo.create({
                    ...list,
                    board: savedBoard,
                }),
            );
            savedBoard.lists = await listRepo.save(defaultLists);

            return savedBoard;
        });

        const boardSnapshot: BoardSnapshot = {
            id: newBoard.id,
            name: newBoard.name,
            teamId: newBoard.teamId,
        };

        const eventPayload: BoardCreatedEventPayload = {
            board: boardSnapshot,
            requester: requesterProfile || { id: requesterId, name: 'Unknown' },
        };
        this.amqp.publish(EVENTS_EXCHANGE, EVENTS.BOARD_CREATED, eventPayload);

        this.logger.log(`Board "${name}" (ID: ${newBoard.id}) created successfully.`);
        return newBoard;
    }


    async createList(
        createListDto: CreateListDto,
        requesterId: string,
    ): Promise<List> {
        const { title, boardId } = createListDto;
        this.logger.log(
            `User ${requesterId} creating list "${title}" in board ${boardId}`,
        );

        const requesterProfile = await this._getUserProfile(requesterId);

        const newList = await this.dataSource.transaction(async (manager) => {
            const board = await this._verifyBoardAccess(
                requesterId,
                boardId,
                [MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER],
                manager,
            );

            const listRepo = manager.getRepository(List);

            const maxPositionResult = await listRepo
                .createQueryBuilder('list')
                .select('MAX(list.position)', 'maxPos')
                .where('list.board_id = :boardId', { boardId })
                .getRawOne();

            const newPosition = (maxPositionResult?.maxPos || 0) + 1;

            const list = listRepo.create({
                title,
                board: board,
                position: newPosition,
            });
            const savedList = await listRepo.save(list);

            return { savedList, board, requesterProfile };
        });

        const { savedList, board, requesterProfile: profile } = newList;

        const listSnapshot: ListSnapshot = {
            id: savedList.id,
            title: savedList.title,
            position: savedList.position,
        };

        const eventPayload: ListCreatedEventPayload = {
            list: listSnapshot,
            board: { id: board.id, name: board.name, teamId: board.teamId },
            requester: profile || { id: requesterId, name: 'Unknown' },
        };
        this.amqp.publish(EVENTS_EXCHANGE, EVENTS.LIST_CREATED, eventPayload);

        return savedList;
    }

    async getBoardById(boardId: string, requesterId: string): Promise<Board> {
        this.logger.log(`User ${requesterId} fetching board ${boardId}`);

        const board = await this.boardRepo.findOne({ where: { id: boardId } });
        if (!board) {
            throw new NotFoundException(`Board with ID ${boardId} not found.`);
        }

        try {
            const rpcResult = await this.amqp.request({
                exchange: TEAM_EXCHANGE,
                routingKey: TEAM_PATTERN.VERIFY_PERMISSION,
                payload: {
                    userId: requesterId,
                    teamId: board.teamId,
                    roles: [MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER], // Giả sử member có thể xem
                },
                timeout: 3000,
            });
            unwrapRpcResult(rpcResult);
        } catch (error) {
            throw new ForbiddenException(
                'You do not have permission to view this board.',
            );
        }

        const boardWithLists = await this.boardRepo
            .createQueryBuilder('board')
            .leftJoinAndSelect('board.lists', 'list')
            .where('board.id = :boardId', { boardId })
            .andWhere('list.isArchived = :isArchived', { isArchived: false }) // Chỉ lấy list chưa lưu trữ
            .orderBy('list.position', 'ASC')
            .getOne();

        if (!boardWithLists) {
            return board;
        }

        return boardWithLists;
    }


    async getBoardsForUser(userId: string): Promise<Board[]> {
        this.logger.log(`Fetching all boards for user ${userId}`);

        let userTeamIds: string[] = [];
        try {
            const rpcResult = await this.amqp.request<string[]>({
                exchange: TEAM_EXCHANGE,
                routingKey: TEAM_PATTERN.FIND_ROOMS_BY_USER_ID,
                payload: userId,
                timeout: 3000,
            });
            userTeamIds = unwrapRpcResult(rpcResult);
        } catch (error) {
            this.logger.error(`Failed to fetch teams for user ${userId}: ${error.message}`);
            return [];
        }

        if (userTeamIds.length === 0) {
            return [];
        }

        const boards = await this.boardRepo.find({
            where: {
                teamId: In(userTeamIds),
                isArchived: false,
            },
            relations: ['lists'],
        });

        return boards;
    }

    async updateList(
        payload: UpdateListDto,
        requesterId: string,
    ): Promise<List> {
        const { listId, title, position } = payload;
        this.logger.log(
            `User ${requesterId} updating list ${listId} to title "${title}" and position ${position}`,
        );

        const updatedList = await this.dataSource.transaction(
            async (manager: EntityManager) => {
                const listRepo = manager.getRepository(List);

                const list = await listRepo.findOne({
                    where: { id: listId },
                    relations: ['board'],
                    lock: { mode: 'pessimistic_write' }
                });

                if (!list) {
                    throw new NotFoundException(`List with ID ${listId} not found.`);
                }

                await this._verifyBoardAccess(
                    requesterId,
                    list.board.id,
                    [MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER],
                    manager,
                );

                if (title) {
                    list.title = title;
                }
                if (position) {
                    list.position = position;
                }

                return await manager.save(list);
            },
        );

        const eventPayload: ListUpdatedEventPayload = {
            listId: updatedList.id,
            boardId: updatedList.board.id,
            title: updatedList.title,
            position: updatedList.position,
            requesterId: requesterId,
        };
        this.amqp.publish(EVENTS_EXCHANGE, EVENTS.LIST_UPDATED, eventPayload);

        return updatedList;
    }
}