import { MessageErrorHandler } from "@golevelup/nestjs-rabbitmq";

export const customErrorHandler: MessageErrorHandler = async (channel, msg, error) => {
    try {
        console.error("RabbitMQ error:", error);

        if (msg?.properties?.replyTo && msg?.properties?.correlationId) {
            const errorPayload = {
                error: true,
                message: error?.message || error?.error?.message || 'Unknown RPC error',
                statusCode: error?.error?.statusCode || error?.statusCode || 500,
            };

            const buffer = Buffer.from(JSON.stringify(errorPayload));

            channel.sendToQueue(
                msg.properties.replyTo,
                buffer,
                { correlationId: msg.properties.correlationId },
            );
        }
    } catch (err) {
        console.error("Failed to send RPC error response:", err);
    } finally {
        channel.ack(msg);
    }
};
