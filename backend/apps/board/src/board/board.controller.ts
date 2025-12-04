import { Controller, Logger } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { BoardService } from './board.service';
import {
  BOARD_PATTERN,
  BOARD_EXCHANGE,
  CreateBoardDto,
  CreateListDto,
  UpdateListDto,
} from '@app/contracts';
import { customErrorHandler } from '@app/common';

@Controller()
export class BoardController {
  private readonly logger = new Logger(BoardController.name);

  constructor(private readonly boardService: BoardService) { }

  @RabbitRPC({
    exchange: BOARD_EXCHANGE,
    routingKey: BOARD_PATTERN.CREATE_BOARD,
    queue: BOARD_PATTERN.CREATE_BOARD,
    errorHandler: customErrorHandler,
  })
  async createBoard(
    @Payload() data: { createBoardDto: CreateBoardDto; requesterId: string },
  ) {
    this.logger.log('Received createBoard message...');
    return this.boardService.create(data.createBoardDto, data.requesterId);
  }


  @RabbitRPC({
    exchange: BOARD_EXCHANGE,
    routingKey: BOARD_PATTERN.CREATE_LIST,
    queue: BOARD_PATTERN.CREATE_LIST,
    errorHandler: customErrorHandler,
  })
  async createList(
    @Payload() data: { createListDto: CreateListDto; requesterId: string },
  ) {
    this.logger.log(
      `Received createList message for board ${data.createListDto.boardId}`,
    );
    return this.boardService.createList(data.createListDto, data.requesterId);
  }


  @RabbitRPC({
    exchange: BOARD_EXCHANGE,
    routingKey: BOARD_PATTERN.UPDATE_LIST,
    queue: BOARD_PATTERN.UPDATE_LIST,
    errorHandler: customErrorHandler,
  })
  async updateList(
    @Payload() data: { updateListDto: UpdateListDto; requesterId: string },
  ) {
    this.logger.log(
      `Received updateList message for list ${data.updateListDto.listId}`,
    );
    return this.boardService.updateList(data.updateListDto, data.requesterId);
  }

  @RabbitRPC({
    exchange: BOARD_EXCHANGE,
    routingKey: BOARD_PATTERN.GET_BOARD_BY_ID,
    queue: BOARD_PATTERN.GET_BOARD_BY_ID,
    errorHandler: customErrorHandler,
  })
  async getBoardById(
    @Payload() data: { boardId: string; requesterId: string },
  ) {
    this.logger.log(`Received getBoardById message for board ${data.boardId}`);
    return this.boardService.getBoardById(data.boardId, data.requesterId);
  }

  @RabbitRPC({
    exchange: BOARD_EXCHANGE,
    routingKey: BOARD_PATTERN.GET_BOARDS_FOR_USER,
    queue: BOARD_PATTERN.GET_BOARDS_FOR_USER,
    errorHandler: customErrorHandler,
  })
  async getBoardsForUser(@Payload() userId: string) {
    this.logger.log(`Received getBoardsForUser message for user ${userId}`);
    return this.boardService.getBoardsForUser(userId);
  }
}