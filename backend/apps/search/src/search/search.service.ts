import { ClientConfigService, SearchMessageDto, SendMessageEventPayload, User } from '@app/contracts';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MeiliSearch } from 'meilisearch';

@Injectable()
export class SearchService implements OnModuleInit {
    private meili: MeiliSearch
    private readonly logger = new Logger(SearchService.name)

    constructor(cfg: ClientConfigService,
    ) {
        this.meili = new MeiliSearch({
            host: cfg.getSearchHost(),
            apiKey: cfg.getSearchApiKey(),
        })
    }

    async onModuleInit() {
        await this.setupIndexes();
    }

    async setupIndexes() {
        const index = this.meili.index('messages');
        await index.updateFilterableAttributes(['conversationId']);
        await index.updateSearchableAttributes([
            'content',
            'sender.name'
        ]);
    }

    async handleNewMessage(payload: SendMessageEventPayload) {
        const { conversationId, content, attachments, sender, createdAt, id } = payload
        this.logger.log(`Received new message for conversation ${conversationId}`)

        try {
            const messageDoc = {
                id,
                content,
                conversationId,
                sender,
                attachments,
                createdAt,
            };

            const index = this.meili.index('messages');
            await index.addDocuments([messageDoc], { primaryKey: 'id' });
        } catch (error) {
            this.logger.error(`Failed to index new message for conversation ${conversationId}`, error);
        }
    }

    async handleUserUpdated(user: Partial<User>) {
        this.logger.log(`User ${user.email} updated. Syncing messages...`);
        const index = this.meili.index('messages');

        try {
            const documents = await index.getDocuments({
                filter: [`sender._id = "${user.id}"`],
                fields: ['id']
            });
            const messageIds = documents.results.map(d => d.id);

            if (messageIds.length == 0) {
                this.logger.log(`No messages found for user ${user.email}`);
                return;
            }

            const updated = messageIds.map(id => ({
                id,
                sender: {
                    _id: user.id,
                    name: user.name,
                    avatar: user.avatar
                }
            }))

            const task = await index.updateDocuments(updated);
            this.logger.log(`Sync task ${task.taskUid} created for user ${user.email}`);
        } catch (error) {
            this.logger.error(`Failed to sync messages for user ${user.email}`, error);
        }
    }

    async searchMessages(payload: SearchMessageDto) {
        const { conversationId, query, options } = payload;
        const { page = 1, limit = 20 } = options;
        const offset = (page - 1) * limit;
        const index = this.meili.index('messages');

        try {
            const documents = await index.search(query, {
                filter: [`conversationId = "${conversationId}"`],
                attributesToRetrieve: ['id', 'content', 'sender', 'attachments', 'createdAt'],
                attributesToSearchOn: ["content"],
                offset,
                limit
            });
            return {
                hits: documents.hits,
                totalHits: documents.estimatedTotalHits,
                totalPages: Math.ceil(documents.estimatedTotalHits / limit),
                currentPage: page,
            };
        } catch (error) {
            this.logger.error(`Failed to search messages for conversation ${conversationId}`, error);
        }
    }

}
