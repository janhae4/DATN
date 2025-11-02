import { ClientConfigService, SearchMessageDto, SendAiMessageEventPayload, SENDER_SNAPSHOT_AI, SENDER_SNAPSHOT_SYSTEM, SendMessageEventPayload, User } from '@app/contracts';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MeiliSearch } from 'meilisearch';
const BATCH_SIZE = 500;

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
        this.logger.log('Setting up "messages" index...');
        const messageIndex = this.meili.index('messages');
        await messageIndex.updateFilterableAttributes([
            'team.id',
            'message.sender._id',
            'discussionId',
            'participantIds',
        ]);

        await messageIndex.updateSearchableAttributes([
            'message.content',
            'message.sender.name',
            'team.name'
        ]);

        // this.logger.log('Setting up "sessions" index...');
        // const sessionIndex = this.meili.index('sessions');
        // await sessionIndex.updateFilterableAttributes([
        //     'sessionId',
        //     'sender._id',
        //     'teamId',
        //     'role',
        // ]);
        // await sessionIndex.updateSearchableAttributes(['content', 'sender.name']);

        // this.logger.log('Setting up "documents" index...');
        // const documentIndex = this.meili.index('documents');
        // await documentIndex.updateFilterableAttributes([
        //     'metadata.user_id',
        //     'metadata.team_id',
        //     'metadata.source',
        // ]);
        // await documentIndex.updateSearchableAttributes([
        //     'content',
        //     'metadata.file_name',
        // ]);

        // this.logger.log('All indexes configured.');
    }

    async handleNewMessage(payload: SendMessageEventPayload) {
        const {
            _id,
            discussionId,
            messageSnapshot,
            teamSnapshot,
            participantIds
        } = payload;
        this.logger.log(`Received new discussion message for ${discussionId}`);

        if (!participantIds?.length) return;
        if (messageSnapshot.sender === SENDER_SNAPSHOT_SYSTEM) return;
        // if (messageSnapshot.sender === SENDER_SNAPSHOT_AI) return;
        try {
            const messageDoc = {
                id: messageSnapshot._id,
                discussionId: discussionId,
                team: { ...teamSnapshot },
                message: { ...messageSnapshot },
                participantIds
            };

            const index = this.meili.index('messages');
            await index.addDocuments([messageDoc], { primaryKey: 'id' });
        } catch (error) {
            this.logger.error(
                `Failed to index new discussion message for ${discussionId}`,
                error,
            );
        }
    }

    // async handleNewMessageChatbot(payload: SendAiMessageEventPayload) {
    //     const { id, conversationId, content, sender, timestamp, role, teamId, metadata } = payload;
    //     this.logger.log(`Received new message for conversation ${conversationId}`)

    //     try {
    //         const messageDoc = {
    //             id,
    //             content,
    //             conversationId,
    //             sender,
    //             createdAt: timestamp,
    //             chatbotRole: role,
    //             teamId,
    //             metadata,
    //             attachment: []
    //         };

    //         const index = this.meili.index('messages');
    //         await index.addDocuments([messageDoc], { primaryKey: 'id' });
    //     } catch (error) {
    //         this.logger.error(`Failed to index new message for conversation ${conversationId}`, error);
    //     }
    // }

    async handleUserUpdated(user: Partial<User>) {
        if (!user.id) {
            this.logger.warn('handleUserUpdated skipped: no user.id');
            return;
        }

        const partialSender: { [key: string]: any } = {};
        if (user.name !== undefined) partialSender.name = user.name;
        if (user.avatar !== undefined) partialSender.avatar = user.avatar;

        if (Object.keys(partialSender).length === 0) {
            this.logger.log(`No syncable fields for user ${user.id}.`);
            return;
        }

        this.logger.log(`Sync (Paginated): Updating sender info for user ${user.id}`);
        const index = this.meili.index('messages');
        const filter = `message.sender._id = "${user.id}"`;

        const BATCH_SIZE = 5000;
        let offset = 0;
        let totalProcessed = 0;

        try {
            while (true) {
                const batch = await index.getDocuments({
                    filter: [filter],
                    fields: ['id'],
                    limit: BATCH_SIZE,
                    offset: offset
                });

                if (batch.results.length === 0) {
                    break;
                }

                const updatedDocsBatch = batch.results.map(doc => ({
                    id: doc.id,
                    message: {
                        sender: partialSender
                    }
                }));

                if (updatedDocsBatch.length > 0) {
                    const task = await index.updateDocuments(updatedDocsBatch);
                    this.logger.log(`Task ${task.taskUid} created for batch of ${updatedDocsBatch.length}`);
                    totalProcessed += updatedDocsBatch.length;
                }

                offset += batch.results.length;
            }

            this.logger.log(`Sync complete for user ${user.id}. Total processed: ${totalProcessed}`);

        } catch (error) {
            this.logger.error(`Failed during paginated sync for user ${user.id}`, error);
        }
    }

    async handleUserAddedToTeam(userId: string, teamId: string) {
        this.logger.log(`Sync: Adding user ${userId} to all messages in team ${teamId}`);
        const index = this.meili.index('messages');
        const filter = `team.id = "${teamId}"`;

        let offset = 0;
        let totalProcessed = 0;
        try {
            while (true) {
                const batch = await index.getDocuments({
                    filter: [filter],
                    fields: ['id', 'participant_ids'],
                    limit: BATCH_SIZE,
                    offset: offset
                });

                if (batch.results.length === 0) {
                    this.logger.log('Pagination complete. No more documents.');
                    break;
                }

                const updatedDocsBatch = batch.results.map(doc => ({
                    id: doc.id,
                    participant_ids: [...new Set([...(doc.participant_ids || []), userId])]
                }));

                if (updatedDocsBatch.length > 0) {
                    const task = await index.updateDocuments(updatedDocsBatch);
                    this.logger.log(`Task ${task.taskUid} created for batch of ${updatedDocsBatch.length}`);
                    totalProcessed += updatedDocsBatch.length;
                }

                offset += batch.results.length;
            }

            this.logger.log(`Sync complete for adding user. Total processed: ${totalProcessed}`);
        } catch (error) {
            this.logger.error(`Failed to sync add user ${userId} to team ${teamId}`, error);
        }
    }

    async handleUserRemovedFromTeam(userId: string, teamId: string) {
        this.logger.log(`Sync: Removing user ${userId} from all messages in team ${teamId}`);
        const index = this.meili.index('messages');
        const filter = `team.id = "${teamId}"`;

        let offset = 0;
        let totalProcessed = 0;

        try {
            while (true) {
                const batch = await index.getDocuments({
                    filter: [filter],
                    fields: ['id', 'participant_ids'],
                    limit: BATCH_SIZE,
                    offset: offset
                });

                if (batch.results.length === 0) {
                    break;
                }

                const updatedDocsBatch = batch.results.map(doc => ({
                    id: doc.id,
                    participant_ids: (doc.participant_ids as string[] || []).filter(id => id !== userId)
                }));

                if (updatedDocsBatch.length > 0) {
                    const task = await index.updateDocuments(updatedDocsBatch);
                    this.logger.log(`Task ${task.taskUid} created for batch of ${updatedDocsBatch.length}`);
                    totalProcessed += updatedDocsBatch.length;
                }

                offset += batch.results.length;
            }

            this.logger.log(`Sync complete for removing user. Total processed: ${totalProcessed}`);
        } catch (error) {
            this.logger.error(`Failed to sync remove user ${userId} from team ${teamId}`, error);
        }
    }

    async handleTeamRemoved(teamId: string) {
        this.logger.log(`Sync: Deleting all messages for team ${teamId}`);
        const index = this.meili.index('messages');
        const filter = `team.id = "${teamId}"`;

        try {
            const task = await index.deleteDocuments([filter]);

            this.logger.log(`Sync task ${task.taskUid} created for deleting team ${teamId}`);
        } catch (error) {
            this.logger.error(`Failed to delete messages for team ${teamId}`, error);
        }
    }

    async searchMessages(payload: SearchMessageDto) {
        const { discussionId, query, options, userId } = payload;
        const { page = 1, limit = 20 } = options;
        const offset = (page - 1) * limit;
        const index = this.meili.index('messages');

        try {
            const filters = [
                `discussionId = "${discussionId}"`,
                `participantIds = "${userId}"`
            ]


            const documents = await index.search(query, {
                filter: filters,
                attributesToRetrieve: [
                    'id',
                    'discussionId',
                    'team',
                    'message'
                ],
                attributesToSearchOn: ["message.content"],
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
            this.logger.error(`Failed to search messages for conversation ${discussionId}`, error);
        }
    }

    async handleIndexDocumentChunk(payload: {
        chunk_id: string;
        content: string;
        metadata: {
            user_id: string;
            team_id?: string;
            source: string;
            file_name: string;
            page?: number;
            processed_at: string;
        };
    }) {
        this.logger.log(`Indexing chunk: ${payload.chunk_id}`);
        try {
            const document = {
                id: payload.chunk_id,
                content: payload.content,
                metadata: payload.metadata,
            };

            const index = this.meili.index('documents');
            await index.addDocuments([document], { primaryKey: 'id' });

        } catch (error) {
            this.logger.error(`Failed to index chunk ${payload.chunk_id}`, error);
        }
    }

    async handleDeleteDocumentIndex(fileId: string) {
        if (!fileId) {
            this.logger.warn('Received DELETE_DOCUMENT_INDEX event without fileId');
            return;
        }
        this.logger.log(`Deleting indexed documents for file: ${fileId}`);
        try {
            const index = this.meili.index('documents');
            const task = await index.deleteDocuments({
                filter: [`metadata.source = "${fileId}"`]
            });
            this.logger.log(`Deletion task ${task.taskUid} created for file ${fileId}`);
        } catch (error) {
            this.logger.error(`Failed to delete indexed documents for file ${fileId}`, error);
        }
    }

}
