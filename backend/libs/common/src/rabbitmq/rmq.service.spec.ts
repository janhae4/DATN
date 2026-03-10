import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { RmqClientService } from './rmq.service';

describe('RmqClientService', () => {
    let service: RmqClientService;
    let amqpConnectionMock: jest.Mocked<AmqpConnection>;

    beforeEach(async () => {
        amqpConnectionMock = {
            request: jest.fn(),
            publish: jest.fn(),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RmqClientService,
                {
                    provide: AmqpConnection,
                    useValue: amqpConnectionMock,
                },
            ],
        }).compile();

        service = module.get<RmqClientService>(RmqClientService);

        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('request', () => {
        const defaultArgs = {
            exchange: 'test_exchange',
            routingKey: 'test_routing_key',
            payload: { data: 'test_data' },
        };

        it('should return successfully on the first try', async () => {
            const expectedResponse = { success: true, data: 'hello' };
            amqpConnectionMock.request.mockResolvedValueOnce(expectedResponse);

            const result = await service.request(defaultArgs);

            expect(result).toEqual(expectedResponse);
            expect(amqpConnectionMock.request).toHaveBeenCalledTimes(1);
        });

        it('should throw immediately if response contains a logical error (e.g. status 400)', async () => {
            amqpConnectionMock.request.mockResolvedValueOnce({
                error: true,
                message: 'Bad Request Data',
                statusCode: HttpStatus.BAD_REQUEST,
            });

            await expect(service.request(defaultArgs)).rejects.toThrow(
                new HttpException('Bad Request Data', HttpStatus.BAD_REQUEST),
            );

            expect(amqpConnectionMock.request).toHaveBeenCalledTimes(1);
        });

        it('should retry when resolving a 504 Gateway Timeout and then succeed', async () => {
            amqpConnectionMock.request
                .mockResolvedValueOnce({
                    error: true,
                    message: 'Timeout occurred',
                    statusCode: HttpStatus.GATEWAY_TIMEOUT,
                })
                .mockResolvedValueOnce({ success: true, retryWorked: true });

            const result = await service.request(defaultArgs);

            expect(result).toEqual({ success: true, retryWorked: true });
            expect(amqpConnectionMock.request).toHaveBeenCalledTimes(2);
        });

        it('should fail after max retries (3) when encountering 500 Internal Server Error', async () => {
            amqpConnectionMock.request.mockResolvedValue({
                error: true,
                message: 'Server crashed',
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            });

            await expect(service.request(defaultArgs)).rejects.toThrow(
                new HttpException('Server crashed', HttpStatus.INTERNAL_SERVER_ERROR),
            );

            expect(amqpConnectionMock.request).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
        }, 15000); // Tăng timeout cho luồng chạy retry exponential backoff
        
        it('should handle unhandled exception by throwing HTTP service unavailable', async () => {
            amqpConnectionMock.request
                .mockRejectedValueOnce(new Error('Network error 1'))
                .mockRejectedValueOnce(new Error('Network error 2'))
                .mockRejectedValueOnce(new Error('Network error 3'));

            await expect(service.request(defaultArgs)).rejects.toThrow(
                new HttpException('Service Unavailable', HttpStatus.GATEWAY_TIMEOUT),
            );
        });
    });

    describe('publish', () => {
        it('should publish message correctly without error', async () => {
            amqpConnectionMock.publish.mockResolvedValueOnce(false);

            await expect(
                service.publish('exchange', 'routingKey', { payload: 'data' }),
            ).resolves.not.toThrow();

            expect(amqpConnectionMock.publish).toHaveBeenCalledWith(
                'exchange',
                'routingKey',
                { payload: 'data' },
            );
        });

        it('should throw Service Unavailable if publish fails', async () => {
            amqpConnectionMock.publish.mockRejectedValueOnce(new Error('Connection lost'));

            await expect(
                service.publish('exchange', 'routingKey', {}),
            ).rejects.toThrow(
                new HttpException('Service Unavailable', HttpStatus.GATEWAY_TIMEOUT),
            );
        });
    });
});
