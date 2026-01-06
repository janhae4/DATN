/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./apps/redis/src/redis/redis.controller.ts":
/*!**************************************************!*\
  !*** ./apps/redis/src/redis/redis.controller.ts ***!
  \**************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RedisController = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const redis_service_1 = __webpack_require__(/*! ./redis.service */ "./apps/redis/src/redis/redis.service.ts");
const nestjs_rabbitmq_1 = __webpack_require__(/*! @golevelup/nestjs-rabbitmq */ "@golevelup/nestjs-rabbitmq");
const contracts_1 = __webpack_require__(/*! @app/contracts */ "./libs/contracts/src/index.ts");
const common_2 = __webpack_require__(/*! @app/common */ "./libs/common/src/index.ts");
let RedisController = class RedisController {
    redisService;
    constructor(redisService) {
        this.redisService = redisService;
    }
    async storeRefreshToken(data) {
        const { userId, sessionId, hashedRefresh, exp } = data;
        return await this.redisService.storeRefreshToken(userId, sessionId, hashedRefresh, exp);
    }
    async storeGoogleToken(data) {
        const { userId, accessToken, refreshToken } = data;
        console.log('Google userID', userId);
        console.log('Google accessToken', accessToken);
        console.log('Google refreshToken', refreshToken);
        return await this.redisService.storeGoogleToken(userId, accessToken, refreshToken);
    }
    async getStoredRefreshToken(data) {
        console.log(data);
        const { userId, sessionId } = data;
        return await this.redisService.getStoredRefreshToken(userId, sessionId);
    }
    async getGoogleToken(userId) {
        console.log('Google userID', userId);
        return await this.redisService.getGoogleToken(userId);
    }
    async deleteRefreshToken(data) {
        const { userId, sessionId } = data;
        return await this.redisService.deleteRefreshToken(userId, sessionId);
    }
    async clearRefreshTokens(userId) {
        return await this.redisService.clearRefreshTokens(userId);
    }
    async setLockKey(data) {
        const { userId, sessionId } = data;
        return await this.redisService.setLockKey(userId, sessionId);
    }
    async login(payload) {
        return await this.redisService.handleUserLogin(payload.user, payload.memberRoles);
    }
    async userUpdated(user) {
        return await this.redisService.userUpdated(user);
    }
    async createTeam(payload) {
        return await this.redisService.createTeam(payload);
    }
    async addMember(payload) {
        return await this.redisService.addMember(payload);
    }
    async removeMember(payload) {
        return await this.redisService.removeMember(payload);
    }
    async removeTeam(payload) {
        return await this.redisService.removeTeam(payload);
    }
    async renameTeam(payload) {
    }
    async leaveTeam(payload) {
        return await this.redisService.leaveTeam(payload);
    }
    async ownershipTransferred(payload) {
        return await this.redisService.ownershipTransferred(payload);
    }
    async changeRoleTeam(payload) {
        return await this.redisService.changeRoleTeam(payload);
    }
    async getUserInfo(userIds) {
        return await this.redisService.getUserInfo(userIds);
    }
    async getUserRole(payload) {
        const { userId, teamId } = payload;
        return await this.redisService.getUserRole(userId, teamId);
    }
    async cacheUserProfile(userIds) {
        return await this.redisService.getManyUserInfo(userIds);
    }
    async setManyUserInfo(users) {
        return await this.redisService.setManyUserInfo(users);
    }
    async getTeamMembers(teamId) {
        return await this.redisService.getTeamMembers(teamId);
    }
    async getTeamMembersWithProfiles(teamId) {
        return await this.redisService.getTeamMembersWithProfiles(teamId);
    }
    async setTeamMembers(payload) {
        const { teamId, members } = payload;
        return await this.redisService.setTeamMembers(teamId, members);
    }
};
exports.RedisController = RedisController;
__decorate([
    (0, nestjs_rabbitmq_1.RabbitRPC)({
        exchange: contracts_1.REDIS_EXCHANGE,
        routingKey: contracts_1.REDIS_PATTERN.STORE_REFRESH_TOKEN,
        queue: contracts_1.REDIS_PATTERN.STORE_REFRESH_TOKEN,
        errorHandler: common_2.customErrorHandler
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RedisController.prototype, "storeRefreshToken", null);
__decorate([
    (0, nestjs_rabbitmq_1.RabbitRPC)({
        exchange: contracts_1.REDIS_EXCHANGE,
        routingKey: contracts_1.REDIS_PATTERN.STORE_GOOGLE_TOKEN,
        queue: contracts_1.REDIS_PATTERN.STORE_GOOGLE_TOKEN,
        errorHandler: common_2.customErrorHandler
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RedisController.prototype, "storeGoogleToken", null);
__decorate([
    (0, nestjs_rabbitmq_1.RabbitRPC)({
        exchange: contracts_1.REDIS_EXCHANGE,
        routingKey: contracts_1.REDIS_PATTERN.GET_STORED_REFRESH_TOKEN,
        queue: contracts_1.REDIS_PATTERN.GET_STORED_REFRESH_TOKEN,
        errorHandler: common_2.customErrorHandler
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RedisController.prototype, "getStoredRefreshToken", null);
__decorate([
    (0, nestjs_rabbitmq_1.RabbitRPC)({
        exchange: contracts_1.REDIS_EXCHANGE,
        routingKey: contracts_1.REDIS_PATTERN.GET_GOOGLE_TOKEN,
        queue: contracts_1.REDIS_PATTERN.GET_GOOGLE_TOKEN,
        errorHandler: common_2.customErrorHandler
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RedisController.prototype, "getGoogleToken", null);
__decorate([
    (0, nestjs_rabbitmq_1.RabbitRPC)({
        exchange: contracts_1.REDIS_EXCHANGE,
        routingKey: contracts_1.REDIS_PATTERN.DELETE_REFRESH_TOKEN,
        queue: contracts_1.REDIS_PATTERN.DELETE_REFRESH_TOKEN,
        errorHandler: common_2.customErrorHandler
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RedisController.prototype, "deleteRefreshToken", null);
__decorate([
    (0, nestjs_rabbitmq_1.RabbitRPC)({
        exchange: contracts_1.REDIS_EXCHANGE,
        routingKey: contracts_1.REDIS_PATTERN.CLEAR_REFRESH_TOKENS,
        queue: contracts_1.REDIS_PATTERN.CLEAR_REFRESH_TOKENS,
        errorHandler: common_2.customErrorHandler
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RedisController.prototype, "clearRefreshTokens", null);
__decorate([
    (0, nestjs_rabbitmq_1.RabbitRPC)({
        exchange: contracts_1.REDIS_EXCHANGE,
        routingKey: contracts_1.REDIS_PATTERN.SET_LOCK_KEY,
        queue: contracts_1.REDIS_PATTERN.SET_LOCK_KEY,
        errorHandler: common_2.customErrorHandler
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RedisController.prototype, "setLockKey", null);
__decorate([
    (0, nestjs_rabbitmq_1.RabbitSubscribe)({
        exchange: contracts_1.EVENTS_EXCHANGE,
        routingKey: contracts_1.EVENTS.LOGIN,
        queue: "event.login.redis",
        errorHandler: common_2.customErrorHandler
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RedisController.prototype, "login", null);
__decorate([
    (0, nestjs_rabbitmq_1.RabbitSubscribe)({
        exchange: contracts_1.EVENTS_EXCHANGE,
        routingKey: contracts_1.EVENTS.USER_UPDATED,
        queue: "event.user.updated.redis",
        errorHandler: common_2.customErrorHandler
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof contracts_1.User !== "undefined" && contracts_1.User) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], RedisController.prototype, "userUpdated", null);
__decorate([
    (0, nestjs_rabbitmq_1.RabbitSubscribe)({
        exchange: contracts_1.EVENTS_EXCHANGE,
        routingKey: contracts_1.EVENTS.CREATE_TEAM,
        queue: "event.create.team.redis",
        errorHandler: common_2.customErrorHandler
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RedisController.prototype, "createTeam", null);
__decorate([
    (0, nestjs_rabbitmq_1.RabbitSubscribe)({
        exchange: contracts_1.EVENTS_EXCHANGE,
        routingKey: contracts_1.EVENTS.ADD_MEMBER,
        queue: "event.add.team.redis",
        errorHandler: common_2.customErrorHandler
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RedisController.prototype, "addMember", null);
__decorate([
    (0, nestjs_rabbitmq_1.RabbitSubscribe)({
        exchange: contracts_1.EVENTS_EXCHANGE,
        routingKey: contracts_1.EVENTS.REMOVE_MEMBER,
        queue: "event.remove.team.redis",
        errorHandler: common_2.customErrorHandler
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RedisController.prototype, "removeMember", null);
__decorate([
    (0, nestjs_rabbitmq_1.RabbitSubscribe)({
        exchange: contracts_1.EVENTS_EXCHANGE,
        routingKey: contracts_1.EVENTS.REMOVE_TEAM,
        queue: "event.remove.team.redis",
        errorHandler: common_2.customErrorHandler
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RedisController.prototype, "removeTeam", null);
__decorate([
    (0, nestjs_rabbitmq_1.RabbitSubscribe)({
        exchange: contracts_1.EVENTS_EXCHANGE,
        routingKey: contracts_1.EVENTS.RENAME_TEAM,
        queue: "event.rename.team.redis",
        errorHandler: common_2.customErrorHandler
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RedisController.prototype, "renameTeam", null);
__decorate([
    (0, nestjs_rabbitmq_1.RabbitSubscribe)({
        exchange: contracts_1.EVENTS_EXCHANGE,
        routingKey: contracts_1.EVENTS.LEAVE_TEAM,
        queue: "event.leave.team.redis",
        errorHandler: common_2.customErrorHandler
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RedisController.prototype, "leaveTeam", null);
__decorate([
    (0, nestjs_rabbitmq_1.RabbitSubscribe)({
        exchange: contracts_1.EVENTS_EXCHANGE,
        routingKey: contracts_1.EVENTS.OWNERSHIP_TRANSFERRED,
        queue: "event.join.team.redis",
        errorHandler: common_2.customErrorHandler
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RedisController.prototype, "ownershipTransferred", null);
__decorate([
    (0, nestjs_rabbitmq_1.RabbitSubscribe)({
        exchange: contracts_1.EVENTS_EXCHANGE,
        routingKey: contracts_1.EVENTS.MEMBER_ROLE_CHANGED,
        queue: "event.change.role.team.redis",
        errorHandler: common_2.customErrorHandler
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RedisController.prototype, "changeRoleTeam", null);
__decorate([
    (0, nestjs_rabbitmq_1.RabbitRPC)({
        exchange: contracts_1.REDIS_EXCHANGE,
        routingKey: contracts_1.REDIS_PATTERN.GET_USER_INFO,
        queue: contracts_1.REDIS_PATTERN.GET_USER_INFO,
        errorHandler: common_2.customErrorHandler
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], RedisController.prototype, "getUserInfo", null);
__decorate([
    (0, nestjs_rabbitmq_1.RabbitRPC)({
        exchange: contracts_1.REDIS_EXCHANGE,
        routingKey: contracts_1.REDIS_PATTERN.GET_USER_ROLE,
        queue: contracts_1.REDIS_PATTERN.GET_USER_ROLE,
        errorHandler: common_2.customErrorHandler
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RedisController.prototype, "getUserRole", null);
__decorate([
    (0, nestjs_rabbitmq_1.RabbitRPC)({
        exchange: contracts_1.REDIS_EXCHANGE,
        routingKey: contracts_1.REDIS_PATTERN.GET_MANY_USERS_INFO,
        queue: contracts_1.REDIS_PATTERN.GET_MANY_USERS_INFO,
        errorHandler: common_2.customErrorHandler
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], RedisController.prototype, "cacheUserProfile", null);
__decorate([
    (0, nestjs_rabbitmq_1.RabbitSubscribe)({
        exchange: contracts_1.REDIS_EXCHANGE,
        routingKey: contracts_1.REDIS_PATTERN.SET_MANY_USERS_INFO,
        queue: contracts_1.REDIS_PATTERN.SET_MANY_USERS_INFO,
        errorHandler: common_2.customErrorHandler
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], RedisController.prototype, "setManyUserInfo", null);
__decorate([
    (0, nestjs_rabbitmq_1.RabbitRPC)({
        exchange: contracts_1.REDIS_EXCHANGE,
        routingKey: contracts_1.REDIS_PATTERN.GET_TEAM_MEMBERS,
        queue: contracts_1.REDIS_PATTERN.GET_TEAM_MEMBERS,
        errorHandler: common_2.customErrorHandler
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RedisController.prototype, "getTeamMembers", null);
__decorate([
    (0, nestjs_rabbitmq_1.RabbitRPC)({
        exchange: contracts_1.REDIS_EXCHANGE,
        routingKey: contracts_1.REDIS_PATTERN.GET_TEAM_MEMBERS_WITH_PROFILES,
        queue: contracts_1.REDIS_PATTERN.GET_TEAM_MEMBERS_WITH_PROFILES,
        errorHandler: common_2.customErrorHandler
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RedisController.prototype, "getTeamMembersWithProfiles", null);
__decorate([
    (0, nestjs_rabbitmq_1.RabbitRPC)({
        exchange: contracts_1.REDIS_EXCHANGE,
        routingKey: contracts_1.REDIS_PATTERN.SET_TEAM_MEMBERS,
        queue: contracts_1.REDIS_PATTERN.SET_TEAM_MEMBERS,
        errorHandler: common_2.customErrorHandler
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RedisController.prototype, "setTeamMembers", null);
exports.RedisController = RedisController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [typeof (_a = typeof redis_service_1.RedisService !== "undefined" && redis_service_1.RedisService) === "function" ? _a : Object])
], RedisController);


/***/ }),

/***/ "./apps/redis/src/redis/redis.module.ts":
/*!**********************************************!*\
  !*** ./apps/redis/src/redis/redis.module.ts ***!
  \**********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RedisModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const redis_service_1 = __webpack_require__(/*! ./redis.service */ "./apps/redis/src/redis/redis.service.ts");
const redis_controller_1 = __webpack_require__(/*! ./redis.controller */ "./apps/redis/src/redis/redis.controller.ts");
const contracts_1 = __webpack_require__(/*! @app/contracts */ "./libs/contracts/src/index.ts");
const nestjs_rabbitmq_1 = __webpack_require__(/*! @golevelup/nestjs-rabbitmq */ "@golevelup/nestjs-rabbitmq");
let RedisModule = class RedisModule {
};
exports.RedisModule = RedisModule;
exports.RedisModule = RedisModule = __decorate([
    (0, common_1.Module)({
        imports: [
            contracts_1.ClientConfigModule,
            nestjs_rabbitmq_1.RabbitMQModule.forRootAsync({
                imports: [contracts_1.ClientConfigModule],
                inject: [contracts_1.ClientConfigService],
                useFactory: (cfg) => {
                    return {
                        exchanges: [
                            {
                                name: contracts_1.REDIS_EXCHANGE,
                                type: 'direct',
                            },
                            {
                                name: contracts_1.EVENTS_EXCHANGE,
                                type: 'topic',
                            },
                            {
                                name: contracts_1.TEAM_EXCHANGE,
                                type: 'direct'
                            }
                        ],
                        uri: cfg.getRMQUrl(),
                        connectionInitOptions: { wait: false },
                    };
                }
            }),
        ],
        controllers: [redis_controller_1.RedisController],
        providers: [redis_service_1.RedisService, redis_controller_1.RedisController],
    })
], RedisModule);


/***/ }),

/***/ "./apps/redis/src/redis/redis.service.ts":
/*!***********************************************!*\
  !*** ./apps/redis/src/redis/redis.service.ts ***!
  \***********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var RedisService_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RedisService = void 0;
const contracts_1 = __webpack_require__(/*! @app/contracts */ "./libs/contracts/src/index.ts");
const error_1 = __webpack_require__(/*! @app/contracts/error */ "./libs/contracts/src/error.ts");
const nestjs_rabbitmq_1 = __webpack_require__(/*! @golevelup/nestjs-rabbitmq */ "@golevelup/nestjs-rabbitmq");
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const config_1 = __webpack_require__(/*! @nestjs/config */ "@nestjs/config");
const ioredis_1 = __importDefault(__webpack_require__(/*! ioredis */ "ioredis"));
config_1.ConfigModule.forRoot();
const TTL_24_HOURS = 86400;
let RedisService = RedisService_1 = class RedisService {
    amqp;
    redis;
    logger = new common_1.Logger(RedisService_1.name);
    constructor(amqp) {
        this.amqp = amqp;
        this.redis = new ioredis_1.default({
            host: process.env.REDIS_CLIENT_HOST || 'localhost',
            port: Number(process.env.REDIS_CLIENT_PORT) || 6379,
        });
    }
    async storeRefreshToken(userId, sessionId, hashedRefresh, exp) {
        const key = `refresh:${userId}:${sessionId}`;
        await this.redis.hmset(key, {
            token: hashedRefresh,
            createdAt: String(Date.now()),
        });
        await this.redis.expire(key, exp);
        this.logger.log('Stored refresh token for user:', userId);
    }
    async getStoredRefreshToken(userId, sessionId) {
        const key = `refresh:${userId}:${sessionId}`;
        const data = await this.redis.hgetall(key);
        this.logger.log('Retrieved refresh token for user:', userId);
        return Object.keys(data).length > 0
            ? data
            : false;
    }
    async deleteRefreshToken(userId, sessionId) {
        const key = `refresh:${userId}:${sessionId}`;
        await this.redis.del(key);
        this.logger.log('Deleted refresh token for user:', userId);
    }
    async clearRefreshTokens(userId) {
        const pattern = `refresh:${userId}:*`;
        const keys = await this.scanKeys(pattern);
        if (keys.length)
            await this.redis.del(keys);
        this.logger.log('Cleared refresh tokens for user:', userId);
    }
    async setLockKey(userId, sessionId) {
        const key = `lock:${userId}:${sessionId}`;
        this.logger.log('Setting lock key for user:', userId);
        return await this.redis.set(key, '1', 'EX', 1000, 'NX');
    }
    async scanKeys(pattern) {
        const found = [];
        let cursor = '0';
        do {
            const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 1000);
            if (keys.length)
                found.push(...keys);
            cursor = nextCursor;
        } while (cursor !== '0');
        return found;
    }
    async storeGoogleToken(userId, accessToken, refreshToken) {
        const accessKey = `google:${userId}:access`;
        const refreshKey = `google:${userId}:refresh`;
        await this.redis.set(accessKey, accessToken, 'EX', 3600);
        if (refreshToken) {
            await this.redis.set(refreshKey, refreshToken);
            this.logger.log('Stored refresh token for user:', userId);
        }
        this.logger.log('Stored access token for user:', userId);
    }
    async getGoogleToken(userId) {
        const accessKey = `google:${userId}:access`;
        const refreshKey = `google:${userId}:refresh`;
        const [accessToken, refreshToken] = await Promise.all([
            this.redis.get(accessKey),
            this.redis.get(refreshKey),
        ]);
        if (!refreshToken) {
            this.logger.warn('No valid Google tokens found for user:', userId);
            throw new error_1.BadRequestException('No Google account linked');
        }
        this.logger.log('Retrieved Google tokens for user:', userId);
        return { accessToken, refreshToken };
    }
    async handleUserLogin(user, memberRoles) {
        if (!user || !user.id)
            return;
        this.logger.log(`Received login event, caching for user: ${user.id}`);
        try {
            const pipe = this.redis.pipeline();
            const profileKey = `user:profile:${user.id}`;
            const profileData = { id: user.id, name: user.name, avatar: user.avatar };
            pipe.set(profileKey, JSON.stringify(profileData), 'EX', TTL_24_HOURS);
            const rolesKey = `user:roles:${user.id}`;
            pipe.del(rolesKey);
            if (memberRoles && memberRoles.length > 0) {
                const rolesMap = memberRoles.reduce((acc, item) => {
                    acc[item.teamId] = item.role;
                    return acc;
                }, {});
                console.log(rolesMap);
                pipe.hset(rolesKey, rolesMap);
            }
            pipe.expire(rolesKey, TTL_24_HOURS);
            await pipe.exec();
            this.logger.log(`Successfully executed cache pipeline for user ${user.id}`);
        }
        catch (redisError) {
            this.logger.error(`Failed to execute cache pipeline for user ${user.id}`, redisError);
        }
    }
    async cacheUserProfile(user) {
        const key = `user:profile:${user.id}`;
        const profileData = {
            id: user.id,
            name: user.name,
            avatar: user.avatar,
        };
        this.logger.log(`Caching profile for user: ${user.id}`);
        return await this.redis.set(key, JSON.stringify(profileData), 'EX', TTL_24_HOURS);
    }
    async getUserInfo(userIds) {
        if (!Array.isArray(userIds)) {
            userIds = typeof userIds === 'string' ? [userIds] : [];
        }
        const keys = userIds.map((id) => `user:profile:${id}`);
        const dataList = await this.redis.mget(keys);
        const profiles = dataList
            .map((data) => (data ? JSON.parse(data) : null))
            .filter(Boolean);
        return profiles;
    }
    async getUserRole(userId, teamId) {
        const key = `user:roles:${userId}`;
        const data = await this.redis.hget(key, teamId);
        this.logger.log('Retrieved user role for user:', userId);
        return data;
    }
    async getManyUserInfo(userIds) {
        if (!Array.isArray(userIds)) {
            userIds = typeof userIds === 'string' ? [userIds] : [];
        }
        const keys = userIds.map((id) => `user:profile:${id}`);
        const results = await this.redis.mget(keys);
        const profiles = results
            .filter(profile => profile != null)
            .map(profile => JSON.parse(profile));
        return profiles;
    }
    async setManyUserInfo(users) {
        const pipe = this.redis.pipeline();
        users.forEach((user) => {
            const key = `user:profile:${user.id}`;
            const profileData = {
                id: user.id,
                name: user.name,
                avatar: user.avatar,
            };
            pipe.set(key, JSON.stringify(profileData), 'EX', TTL_24_HOURS);
        });
        try {
            await pipe.exec();
            this.logger.log(`Successfully cached ${users.length} profiles.`);
        }
        catch (error) {
            this.logger.error('Failed to cache user profiles in pipeline', error);
        }
    }
    async userUpdated(user) {
        if (!user || !user.id)
            return;
        this.logger.log(`Updating cached profile for user: ${user.id}`);
        const key = `user:profile:${user.id}`;
        const profileData = {
            id: user.id,
            name: user.name,
            avatar: user.avatar,
        };
        await this.redis.set(key, JSON.stringify(profileData), 'EX', TTL_24_HOURS);
    }
    async createTeam(payload) {
        const { members, teamSnapshot, owner } = payload;
        const allMembersToCache = [...members, owner];
        const pipe = this.redis.pipeline();
        const teamKey = `team:members:${teamSnapshot.id}`;
        for (const member of allMembersToCache) {
            const profileKey = `user:profile:${member.id}`;
            const profileData = {
                id: member.id,
                name: member.name,
                avatar: member.avatar,
            };
            pipe.set(profileKey, JSON.stringify(profileData), 'EX', TTL_24_HOURS);
            const rolesKey = `user:roles:${member.id}`;
            pipe.hset(rolesKey, teamSnapshot.id, owner.id === member.id ? contracts_1.MemberRole.OWNER : contracts_1.MemberRole.MEMBER);
            pipe.expire(rolesKey, TTL_24_HOURS);
            pipe.sadd(teamKey, member.id);
        }
        pipe.expire(teamKey, TTL_24_HOURS);
        try {
            await pipe.exec();
            this.logger.log(`Cached team ${teamSnapshot.id} and its members successfully.`);
        }
        catch (error) {
            this.logger.error(`Failed to cache team ${teamSnapshot.id} and its members`, error);
        }
    }
    async addMember(payload) {
        const { teamId, members } = payload;
        if (!teamId || !members || members.length === 0)
            return;
        this.logger.log(`Caching ${members.length} new members for team: ${teamId}`);
        const pipe = this.redis.pipeline();
        for (const member of members) {
            const profileKey = `user:profile:${member.id}`;
            const profileData = {
                id: member.id,
                name: member.name,
                avatar: member.avatar,
            };
            pipe.set(profileKey, JSON.stringify(profileData), 'EX', TTL_24_HOURS);
            const rolesKey = `user:roles:${member.id}`;
            pipe.hset(rolesKey, teamId, contracts_1.MemberRole.MEMBER);
            pipe.expire(rolesKey, TTL_24_HOURS);
            const teamKey = `team:members:${teamId}`;
            pipe.sadd(teamKey, member.id);
            pipe.expire(teamKey, TTL_24_HOURS);
        }
        await pipe.exec();
    }
    async removeMember(payload) {
        const { teamId, members } = payload;
        if (!teamId || !members || members.length === 0)
            return;
        this.logger.log(`Removing ${members.length} members from team cache: ${teamId}`);
        const pipe = this.redis.pipeline();
        for (const member of members) {
            const rolesKey = `user:roles:${member.id}`;
            pipe.hdel(rolesKey, teamId);
            const teamKey = `team:members:${teamId}`;
            pipe.srem(teamKey, member.id);
        }
        await pipe.exec();
    }
    async changeRoleTeam(payload) {
        const { teamId, targetId, newRole } = payload;
        if (!teamId || !targetId || !newRole)
            return;
        this.logger.log(`Changing role for ${targetId} in team ${teamId} to ${newRole}`);
        const rolesKey = `user:roles:${targetId}`;
        const pipe = this.redis.pipeline();
        pipe.hset(rolesKey, teamId, newRole);
        pipe.expire(rolesKey, TTL_24_HOURS);
        await pipe.exec();
    }
    async leaveTeam(payload) {
        const { teamId, requester } = payload;
        if (!teamId || !requester || !requester.id)
            return;
        const pipe = this.redis.pipeline();
        const rolesKey = `user:roles:${requester.id}`;
        pipe.hdel(rolesKey, teamId);
        const teamMembersKey = `team:members:${teamId}`;
        pipe.srem(teamMembersKey, requester.id);
        await pipe.exec();
    }
    async removeTeam(payload) {
        const { teamId, memberIdsToNotify } = payload;
        if (!teamId)
            return;
        this.logger.log(`Removing team ${teamId} from all caches...`);
        const pipe = this.redis.pipeline();
        if (memberIdsToNotify && memberIdsToNotify.length > 0) {
            for (const userId of memberIdsToNotify) {
                const rolesKey = `user:roles:${userId}`;
                pipe.hdel(rolesKey, teamId);
            }
        }
        const teamMembersKey = `team:members:${teamId}`;
        pipe.del(teamMembersKey);
        await pipe.exec();
    }
    async ownershipTransferred(payload) {
        const { newOwnerId, teamId, requesterId } = payload;
        const pipe = this.redis.pipeline();
        const oldOwnerRoleKey = `user:roles:${requesterId}`;
        const newOwnerRoleKey = `user:roles:${newOwnerId}`;
        pipe.hset(oldOwnerRoleKey, teamId, contracts_1.MemberRole.MEMBER);
        pipe.expire(oldOwnerRoleKey, TTL_24_HOURS);
        pipe.hset(newOwnerRoleKey, teamId, contracts_1.MemberRole.OWNER);
        pipe.expire(newOwnerRoleKey, TTL_24_HOURS);
        await pipe.exec();
    }
    async getTeamMembers(teamId) {
        const teamMembersKey = `team:members:${teamId}`;
        return await this.redis.smembers(teamMembersKey);
    }
    async getTeamMembersWithProfiles(teamId) {
        const teamMembersKey = `team:members:${teamId}`;
        this.logger.log(`Handler: Getting profiles for members of ${teamId}`);
        const memberIds = await this.redis.smembers(teamMembersKey);
        console.log('Member IDs:', memberIds);
        if (!memberIds || memberIds.length === 0) {
            return [];
        }
        const profileKeys = memberIds.map(id => `user:profile:${id}`);
        const results = await this.redis.mget(profileKeys);
        const profiles = results
            .filter(profileString => profileString !== null)
            .map(profileString => JSON.parse(profileString));
        return profiles;
    }
    async setTeamMembers(teamId, members) {
        const teamMembersKey = `team:members:${teamId}`;
        return await this.redis.sadd(teamMembersKey, members);
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof nestjs_rabbitmq_1.AmqpConnection !== "undefined" && nestjs_rabbitmq_1.AmqpConnection) === "function" ? _a : Object])
], RedisService);


/***/ }),

/***/ "./libs/common/src/auth.gateway.ts":
/*!*****************************************!*\
  !*** ./libs/common/src/auth.gateway.ts ***!
  \*****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuthenticatedGateway = void 0;
const websockets_1 = __webpack_require__(/*! @nestjs/websockets */ "@nestjs/websockets");
const socket_io_1 = __webpack_require__(/*! socket.io */ "socket.io");
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const cookie = __importStar(__webpack_require__(/*! cookie */ "cookie"));
const rxjs_1 = __webpack_require__(/*! rxjs */ "rxjs");
const contracts_1 = __webpack_require__(/*! @app/contracts */ "./libs/contracts/src/index.ts");
const microservices_1 = __webpack_require__(/*! @nestjs/microservices */ "@nestjs/microservices");
let AuthenticatedGateway = class AuthenticatedGateway {
    authClient;
    server;
    logger;
    constructor(authClient, loggerName) {
        this.authClient = authClient;
        this.logger = new common_1.Logger(loggerName);
    }
    async handleConnection(client) {
        this.logger.log(`Client connected: ${client.id}`);
        const cookieString = client.handshake.headers.cookie;
        if (!cookieString) {
            this.logger.warn(`Client ${client.id} - Disconnected, cookie not found.`);
            client.disconnect();
            return;
        }
        try {
            const parsedCookies = cookie.parse(cookieString);
            const accessToken = parsedCookies.accessToken;
            if (!accessToken) {
                throw new Error('Access token not found in cookies.');
            }
            this.logger.log(`Client ${client.id} - Access token found!`);
            const user = await (0, rxjs_1.firstValueFrom)(this.authClient.send(contracts_1.AUTH_PATTERN.VALIDATE_TOKEN, accessToken));
            if (!user) {
                this.logger.warn(`Client ${client.id} - Disconnected, invalid token.`);
                client.disconnect();
                return;
            }
            this.logger.log(`Client ${client.id} - Authenticated: ${user.id}`);
            client.data.user = user;
            this.onClientAuthenticated(client, user);
        }
        catch (error) {
            const e = error;
            this.logger.error(`Client ${client.id} - Failed to validate token: ${e.message}`);
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        const user = client.data.user;
        if (user) {
            this.logger.log(`Client disconnected: ${client.id} (User: ${user.id})`);
        }
        else {
            this.logger.log(`Client disconnected: ${client.id} (User: N/A)`);
        }
    }
};
exports.AuthenticatedGateway = AuthenticatedGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", typeof (_b = typeof socket_io_1.Server !== "undefined" && socket_io_1.Server) === "function" ? _b : Object)
], AuthenticatedGateway.prototype, "server", void 0);
exports.AuthenticatedGateway = AuthenticatedGateway = __decorate([
    __param(0, (0, common_1.Inject)(contracts_1.AUTH_CLIENT)),
    __metadata("design:paramtypes", [typeof (_a = typeof microservices_1.ClientProxy !== "undefined" && microservices_1.ClientProxy) === "function" ? _a : Object, String])
], AuthenticatedGateway);


/***/ }),

/***/ "./libs/common/src/index.ts":
/*!**********************************!*\
  !*** ./libs/common/src/index.ts ***!
  \**********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
__exportStar(__webpack_require__(/*! ./auth.gateway */ "./libs/common/src/auth.gateway.ts"), exports);
__exportStar(__webpack_require__(/*! ./rabbitmq/rabbitmq.module */ "./libs/common/src/rabbitmq/rabbitmq.module.ts"), exports);
__exportStar(__webpack_require__(/*! ./utils/custom-handler-error */ "./libs/common/src/utils/custom-handler-error.ts"), exports);
__exportStar(__webpack_require__(/*! ./unwrap-rpc.error */ "./libs/common/src/unwrap-rpc.error.ts"), exports);


/***/ }),

/***/ "./libs/common/src/rabbitmq/rabbitmq.module.ts":
/*!*****************************************************!*\
  !*** ./libs/common/src/rabbitmq/rabbitmq.module.ts ***!
  \*****************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RMQModule = void 0;
const contracts_1 = __webpack_require__(/*! @app/contracts */ "./libs/contracts/src/index.ts");
const nestjs_rabbitmq_1 = __webpack_require__(/*! @golevelup/nestjs-rabbitmq */ "@golevelup/nestjs-rabbitmq");
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
let RMQModule = class RMQModule {
};
exports.RMQModule = RMQModule;
exports.RMQModule = RMQModule = __decorate([
    (0, common_1.Module)({
        imports: [
            nestjs_rabbitmq_1.RabbitMQModule.forRootAsync({
                inject: [contracts_1.ClientConfigService],
                useFactory: (cfg) => ({
                    exchanges: [
                        {
                            name: contracts_1.EVENTS_EXCHANGE,
                            type: "fanout"
                        }
                    ],
                    uri: cfg.getRMQUrl(),
                })
            })
        ],
        exports: [nestjs_rabbitmq_1.RabbitMQModule]
    })
], RMQModule);


/***/ }),

/***/ "./libs/common/src/unwrap-rpc.error.ts":
/*!*********************************************!*\
  !*** ./libs/common/src/unwrap-rpc.error.ts ***!
  \*********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.unwrapRpcResult = void 0;
const microservices_1 = __webpack_require__(/*! @nestjs/microservices */ "@nestjs/microservices");
const unwrapRpcResult = (result) => {
    console.log(result);
    if (result?.error && result?.message) {
        console.log("RPC Error:", result);
        throw new microservices_1.RpcException(result);
    }
    return result;
};
exports.unwrapRpcResult = unwrapRpcResult;


/***/ }),

/***/ "./libs/common/src/utils/custom-handler-error.ts":
/*!*******************************************************!*\
  !*** ./libs/common/src/utils/custom-handler-error.ts ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.customErrorHandler = void 0;
const customErrorHandler = async (channel, msg, error) => {
    try {
        console.error("RabbitMQ error:", error);
        if (msg?.properties?.replyTo && msg?.properties?.correlationId) {
            const errorPayload = {
                error: true,
                message: error?.message || error?.error?.message || 'Unknown RPC error',
                statusCode: error?.error?.statusCode || error?.statusCode || 500,
            };
            const buffer = Buffer.from(JSON.stringify(errorPayload));
            channel.sendToQueue(msg.properties.replyTo, buffer, { correlationId: msg.properties.correlationId });
        }
    }
    catch (err) {
        console.error("Failed to send RPC error response:", err);
    }
    finally {
        channel.ack(msg);
    }
};
exports.customErrorHandler = customErrorHandler;


/***/ }),

/***/ "./libs/contracts/src/auth/auth.patterns.ts":
/*!**************************************************!*\
  !*** ./libs/contracts/src/auth/auth.patterns.ts ***!
  \**************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AUTH_PATTERN = void 0;
exports.AUTH_PATTERN = {
    INFO: 'auth.info',
    LOGIN: 'auth.login',
    VERIFY_LOCAL: 'auth.verifyLocal',
    VERIFY_LOCAL_TOKEN: 'auth.verifyToken',
    VERIFY_FORGOT_PASSWORD: 'auth.verifyForgotPassword',
    VERIFY_FORGOT_PASSWORD_TOKEN: 'auth.verifyForgotPasswordToken',
    VERIFY_EMAIL: 'auth.verifyEmail',
    RESET_VERIFICATION_CODE: 'auth.resetVerificationCode',
    RESET_CODE: 'auth.resetCode',
    FORGET_PASSWORD: 'auth.forgetPassword',
    CHANGE_PASSWORD: 'auth.changePassword',
    RESET_PASSWORD_CONFIRM: 'auth.resetPasswordConfirm',
    GOOGLE_CALLBACK: 'auth.googleCallback',
    CREATE_ACCESS_TOKEN: 'auth.createAccessToken',
    VALIDATE_TOKEN: 'auth.validateToken',
    REGISTER: 'auth.register',
    LOGOUT: 'auth.logout',
    LOGOUT_ALL: 'auth.logoutAll',
    REFRESH: 'auth.refresh',
};


/***/ }),

/***/ "./libs/contracts/src/auth/dto/account-google.dto.ts":
/*!***********************************************************!*\
  !*** ./libs/contracts/src/auth/dto/account-google.dto.ts ***!
  \***********************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GoogleAccountDto = void 0;
const mapped_types_1 = __webpack_require__(/*! @nestjs/mapped-types */ "@nestjs/mapped-types");
const create_auth_oauth_dto_1 = __webpack_require__(/*! ./create-auth-oauth.dto */ "./libs/contracts/src/auth/dto/create-auth-oauth.dto.ts");
class GoogleAccountDto extends (0, mapped_types_1.PartialType)(create_auth_oauth_dto_1.CreateAuthOAuthDto) {
    accessToken;
    refreshToken;
    isLinking;
    linkedUser;
}
exports.GoogleAccountDto = GoogleAccountDto;


/***/ }),

/***/ "./libs/contracts/src/auth/dto/confirm-reset-password.dto.ts":
/*!*******************************************************************!*\
  !*** ./libs/contracts/src/auth/dto/confirm-reset-password.dto.ts ***!
  \*******************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ConfirmResetPasswordDto = void 0;
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
class ConfirmResetPasswordDto {
    token;
    userId;
    code;
    password;
}
exports.ConfirmResetPasswordDto = ConfirmResetPasswordDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({
        name: 'Token',
        type: String,
        required: false,
    }),
    __metadata("design:type", String)
], ConfirmResetPasswordDto.prototype, "token", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiProperty)({
        name: 'User id',
        type: String,
        required: false,
    }),
    __metadata("design:type", String)
], ConfirmResetPasswordDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({
        name: 'Code',
        type: String,
        required: false,
    }),
    __metadata("design:type", String)
], ConfirmResetPasswordDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({
        name: 'Password',
        type: String,
        required: false,
    }),
    __metadata("design:type", String)
], ConfirmResetPasswordDto.prototype, "password", void 0);


/***/ }),

/***/ "./libs/contracts/src/auth/dto/create-auth-local.dto.ts":
/*!**************************************************************!*\
  !*** ./libs/contracts/src/auth/dto/create-auth-local.dto.ts ***!
  \**************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateAuthLocalDto = void 0;
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
class CreateAuthLocalDto {
    username;
    email;
    password;
    name;
    phone;
    verifiedToken;
}
exports.CreateAuthLocalDto = CreateAuthLocalDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAuthLocalDto.prototype, "username", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateAuthLocalDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAuthLocalDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAuthLocalDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAuthLocalDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAuthLocalDto.prototype, "verifiedToken", void 0);


/***/ }),

/***/ "./libs/contracts/src/auth/dto/create-auth-oauth.dto.ts":
/*!**************************************************************!*\
  !*** ./libs/contracts/src/auth/dto/create-auth-oauth.dto.ts ***!
  \**************************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateAuthOAuthDto = void 0;
class CreateAuthOAuthDto {
    provider;
    providerId;
    email;
    name;
    avatar;
}
exports.CreateAuthOAuthDto = CreateAuthOAuthDto;


/***/ }),

/***/ "./libs/contracts/src/auth/dto/create-auth.dto.ts":
/*!********************************************************!*\
  !*** ./libs/contracts/src/auth/dto/create-auth.dto.ts ***!
  \********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateAuthDto = void 0;
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
class CreateAuthDto {
    username;
    email;
    password;
    name;
    phone;
}
exports.CreateAuthDto = CreateAuthDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiProperty)({
        description: 'Username',
        example: 'chanhhy',
        required: true,
    }),
    __metadata("design:type", String)
], CreateAuthDto.prototype, "username", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsEmail)(),
    (0, swagger_1.ApiProperty)({
        description: 'Email',
        example: 'zodo147@example.com',
        required: true,
    }),
    __metadata("design:type", String)
], CreateAuthDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiProperty)({
        description: 'Password',
        example: '123123',
        required: true,
    }),
    __metadata("design:type", String)
], CreateAuthDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiProperty)({
        description: 'Name',
        example: 'Chanh Hy',
        required: true,
    }),
    __metadata("design:type", String)
], CreateAuthDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsPhoneNumber)('VN'),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAuthDto.prototype, "phone", void 0);


/***/ }),

/***/ "./libs/contracts/src/auth/dto/forgot-password.dto.ts":
/*!************************************************************!*\
  !*** ./libs/contracts/src/auth/dto/forgot-password.dto.ts ***!
  \************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ForgotPasswordDto = void 0;
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
class ForgotPasswordDto {
    email;
}
exports.ForgotPasswordDto = ForgotPasswordDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiProperty)({
        name: 'email or username',
        description: 'Email or username',
        example: 'zodo147@gmail.com',
        required: true,
    }),
    __metadata("design:type", String)
], ForgotPasswordDto.prototype, "email", void 0);


/***/ }),

/***/ "./libs/contracts/src/auth/dto/jwt.dto.ts":
/*!************************************************!*\
  !*** ./libs/contracts/src/auth/dto/jwt.dto.ts ***!
  \************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RefreshTokenDto = exports.AccessTokenDto = exports.JwtDto = void 0;
const mapped_types_1 = __webpack_require__(/*! @nestjs/mapped-types */ "@nestjs/mapped-types");
class JwtDto {
    id;
    iat;
    exp;
    role;
}
exports.JwtDto = JwtDto;
class AccessTokenDto extends (0, mapped_types_1.PartialType)(JwtDto) {
}
exports.AccessTokenDto = AccessTokenDto;
class RefreshTokenDto extends (0, mapped_types_1.PartialType)(JwtDto) {
    sessionId;
}
exports.RefreshTokenDto = RefreshTokenDto;


/***/ }),

/***/ "./libs/contracts/src/auth/dto/login-request.dto.ts":
/*!**********************************************************!*\
  !*** ./libs/contracts/src/auth/dto/login-request.dto.ts ***!
  \**********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LoginDto = void 0;
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
class LoginDto {
    username;
    password;
}
exports.LoginDto = LoginDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiProperty)({
        description: 'Username or email',
        example: 'chanhhy',
        required: true,
    }),
    __metadata("design:type", String)
], LoginDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Password',
        example: '123123',
        required: true,
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);


/***/ }),

/***/ "./libs/contracts/src/auth/dto/login-response.dto.ts":
/*!***********************************************************!*\
  !*** ./libs/contracts/src/auth/dto/login-response.dto.ts ***!
  \***********************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LoginResponseDto = void 0;
class LoginResponseDto {
    userId;
    accessToken;
    refreshToken;
}
exports.LoginResponseDto = LoginResponseDto;


/***/ }),

/***/ "./libs/contracts/src/auth/dto/oauth-login.dto.ts":
/*!********************************************************!*\
  !*** ./libs/contracts/src/auth/dto/oauth-login.dto.ts ***!
  \********************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.OAuthLoginDto = void 0;
class OAuthLoginDto {
    provider;
    providerId;
    email;
    accessToken;
}
exports.OAuthLoginDto = OAuthLoginDto;


/***/ }),

/***/ "./libs/contracts/src/auth/dto/reset-password.dto.ts":
/*!***********************************************************!*\
  !*** ./libs/contracts/src/auth/dto/reset-password.dto.ts ***!
  \***********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ChangePasswordDto = void 0;
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
class ChangePasswordDto {
    id;
    oldPassword;
    newPassword;
}
exports.ChangePasswordDto = ChangePasswordDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    (0, swagger_1.ApiProperty)({
        description: 'User id',
        type: String,
        required: false,
    }),
    __metadata("design:type", String)
], ChangePasswordDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiProperty)({
        description: 'Old password',
        type: String,
        required: true,
    }),
    __metadata("design:type", String)
], ChangePasswordDto.prototype, "oldPassword", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiProperty)({
        description: 'New password',
        type: String,
        required: true,
    }),
    __metadata("design:type", String)
], ChangePasswordDto.prototype, "newPassword", void 0);


/***/ }),

/***/ "./libs/contracts/src/auth/dto/verify-account.dto.ts":
/*!***********************************************************!*\
  !*** ./libs/contracts/src/auth/dto/verify-account.dto.ts ***!
  \***********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.VerifyAccountDto = void 0;
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
class VerifyAccountDto {
    code;
}
exports.VerifyAccountDto = VerifyAccountDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyAccountDto.prototype, "code", void 0);


/***/ }),

/***/ "./libs/contracts/src/auth/jwt.constant.ts":
/*!*************************************************!*\
  !*** ./libs/contracts/src/auth/jwt.constant.ts ***!
  \*************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.REFRESH_TTL = exports.ACCESS_TTL = void 0;
exports.ACCESS_TTL = 15 * 60 * 1000;
exports.REFRESH_TTL = 15 * 24 * 60 * 60 * 1000;


/***/ }),

/***/ "./libs/contracts/src/chatbot/chatbot.pattern.ts":
/*!*******************************************************!*\
  !*** ./libs/contracts/src/chatbot/chatbot.pattern.ts ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CHATBOT_PATTERN = void 0;
exports.CHATBOT_PATTERN = {
    ASK_QUESTION: 'ask_question',
    PROCESS_DOCUMENT: 'process_document',
    DELETE_DOCUMENT_VECTOR: 'delete_document_vector',
    SUMMARIZE_DOCUMENT: 'summarize_document',
    RESPONSE_CHUNK: 'chatbot.response_chunk',
    RESPONSE_START: 'chatbot.response_start',
    RESPONSE_ERROR: 'chatbot.response_error',
    RESPONSE_END: 'chatbot.response_end',
    CREATE: 'chatbot.create',
    STREAM_RESPONSE: 'rag_response',
    UPLOAD_FILE: 'chatbot.upload_file',
    GET_FILES_BY_PREFIX: 'chatbot.get_files_by_prefix',
    DELETE_FILE: 'chatbot.delete_file',
    FIND_CONVERSATIONS: 'chatbot.find_conversations',
    FIND_CONVERSATION: 'chatbot.find_conversation',
    FIND_TEAM_CONVERSATIONS: 'chatbot.find_team_conversations',
    DELETE_CONVERSATION: 'chatbot.delete_conversation',
    HANDLE_MESSAGE: 'chatbot.handle_message',
    GET_FILE_BY_ID: 'chatbot.get_file_by_id',
    UPDATE_FILE: 'chatbot.update_file',
    RENAME_FILE: 'chatbot.rename_file',
    REMOVE_COLLECTION: 'chatbot.remove_collection',
    UPDATE_STATUS_DOCUMENT: 'file.update.status'
};


/***/ }),

/***/ "./libs/contracts/src/chatbot/dto/ask-question.dto.ts":
/*!************************************************************!*\
  !*** ./libs/contracts/src/chatbot/dto/ask-question.dto.ts ***!
  \************************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AskQuestionDto = void 0;
class AskQuestionDto {
    question;
    discussionId;
    teamId;
}
exports.AskQuestionDto = AskQuestionDto;


/***/ }),

/***/ "./libs/contracts/src/chatbot/dto/chatbot-document.dto.ts":
/*!****************************************************************!*\
  !*** ./libs/contracts/src/chatbot/dto/chatbot-document.dto.ts ***!
  \****************************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ProcessDocumentDto = void 0;
class ProcessDocumentDto {
    userId;
}
exports.ProcessDocumentDto = ProcessDocumentDto;


/***/ }),

/***/ "./libs/contracts/src/chatbot/dto/conversation.dto.ts":
/*!************************************************************!*\
  !*** ./libs/contracts/src/chatbot/dto/conversation.dto.ts ***!
  \************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ConversationResponseDto = void 0;
const class_transformer_1 = __webpack_require__(/*! class-transformer */ "class-transformer");
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
const message_response_dto_1 = __webpack_require__(/*! ./message-response.dto */ "./libs/contracts/src/chatbot/dto/message-response.dto.ts");
class ConversationResponseDto {
    _id;
    user_id;
    title;
    messages;
    createdAt;
    updatedAt;
}
exports.ConversationResponseDto = ConversationResponseDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConversationResponseDto.prototype, "_id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ConversationResponseDto.prototype, "user_id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ConversationResponseDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => message_response_dto_1.MessageResponseDto),
    __metadata("design:type", Array)
], ConversationResponseDto.prototype, "messages", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], ConversationResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], ConversationResponseDto.prototype, "updatedAt", void 0);


/***/ }),

/***/ "./libs/contracts/src/chatbot/dto/message-response.dto.ts":
/*!****************************************************************!*\
  !*** ./libs/contracts/src/chatbot/dto/message-response.dto.ts ***!
  \****************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MessageResponseDto = void 0;
const class_transformer_1 = __webpack_require__(/*! class-transformer */ "class-transformer");
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
const message_dto_1 = __webpack_require__(/*! ./message.dto */ "./libs/contracts/src/chatbot/dto/message.dto.ts");
class MessageResponseDto {
    role;
    content;
    timestamp;
    metadata;
}
exports.MessageResponseDto = MessageResponseDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['user', 'ai', 'system']),
    __metadata("design:type", String)
], MessageResponseDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], MessageResponseDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], MessageResponseDto.prototype, "timestamp", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => message_dto_1.MessageMetadataDto),
    __metadata("design:type", typeof (_b = typeof message_dto_1.MessageMetadataDto !== "undefined" && message_dto_1.MessageMetadataDto) === "function" ? _b : Object)
], MessageResponseDto.prototype, "metadata", void 0);


/***/ }),

/***/ "./libs/contracts/src/chatbot/dto/message.dto.ts":
/*!*******************************************************!*\
  !*** ./libs/contracts/src/chatbot/dto/message.dto.ts ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AiDiscussionDto = exports.SENDER_SNAPSHOT_AI = exports.MessageUserChatbot = exports.SendAiMessageEventPayload = exports.AiMessageSnapshot = exports.MessageMetadataDto = exports.RetrievedContextDto = void 0;
class RetrievedContextDto {
    source_id;
    source_name;
    chunk_id;
    page_number;
    score;
    snippet;
}
exports.RetrievedContextDto = RetrievedContextDto;
class MessageMetadataDto {
    retrieved_context;
    error;
}
exports.MessageMetadataDto = MessageMetadataDto;
class AiMessageSnapshot {
    _id;
    sender;
    content;
    createdAt;
    metadata;
}
exports.AiMessageSnapshot = AiMessageSnapshot;
class SendAiMessageEventPayload {
    sender;
    message;
    discussionId;
    teamId;
    metadata;
}
exports.SendAiMessageEventPayload = SendAiMessageEventPayload;
class MessageUserChatbot {
    discussionId;
    userId;
    message;
    teamId;
    metadata;
    summarizeFileName;
    socketId;
}
exports.MessageUserChatbot = MessageUserChatbot;
exports.SENDER_SNAPSHOT_AI = {
    id: 'AI_ID',
    name: 'Ai Assistant',
    avatar: '',
};
class AiDiscussionDto {
    _id;
    name;
    teamId;
    teamSnapshot;
    ownerId;
    latestMessage;
    latestMessageSnapshot;
}
exports.AiDiscussionDto = AiDiscussionDto;


/***/ }),

/***/ "./libs/contracts/src/chatbot/dto/response-stream.dto.ts":
/*!***************************************************************!*\
  !*** ./libs/contracts/src/chatbot/dto/response-stream.dto.ts ***!
  \***************************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ResponseStreamDto = void 0;
class ResponseStreamDto {
    socketId;
    type;
    content;
    discussionId;
    metadata;
    teamId;
    membersToNotify;
}
exports.ResponseStreamDto = ResponseStreamDto;


/***/ }),

/***/ "./libs/contracts/src/chatbot/dto/summarize-document.dto.ts":
/*!******************************************************************!*\
  !*** ./libs/contracts/src/chatbot/dto/summarize-document.dto.ts ***!
  \******************************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SummarizeDocumentDto = void 0;
class SummarizeDocumentDto {
    fileId;
    discussionId;
    teamId;
}
exports.SummarizeDocumentDto = SummarizeDocumentDto;


/***/ }),

/***/ "./libs/contracts/src/client-config/client-config.module.ts":
/*!******************************************************************!*\
  !*** ./libs/contracts/src/client-config/client-config.module.ts ***!
  \******************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ClientConfigModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const client_config_service_1 = __webpack_require__(/*! ./client-config.service */ "./libs/contracts/src/client-config/client-config.service.ts");
const config_1 = __webpack_require__(/*! @nestjs/config */ "@nestjs/config");
const joi = __importStar(__webpack_require__(/*! joi */ "joi"));
const common_2 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
let ClientConfigModule = class ClientConfigModule {
};
exports.ClientConfigModule = ClientConfigModule;
exports.ClientConfigModule = ClientConfigModule = __decorate([
    (0, common_2.Global)(),
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                validationSchema: joi.object({
                    USER_CLIENT_PORT: joi.number().default(3001),
                    AUTH_CLIENT_PORT: joi.number().default(3002),
                    REDIS_CLIENT_PORT: joi.number().default(6379),
                    PROJECT_CLIENT_PORT: joi.number().default(3003),
                    VIDEO_CHAT_CLIENT_PORT: joi.number().default(3004),
                    NOTIFICATION_CLIENT_PORT: joi.number().default(4001),
                    RMQ_URL: joi.string().default('amqp://localhost:5672'),
                    REDIS_QUEUE: joi.string().default('redis_service_queue'),
                    PROJECT_QUEUE: joi.string().default('project_service_queue'),
                    NOTIFICATION_QUEUE: joi.string().default('notification_service_queue'),
                    GOOGLE_CLIENT_ID: joi.string().required(),
                    GOOGLE_CLIENT_SECRET: joi.string().required(),
                    GOOGLE_CALLBACK_URL: joi.string().uri().required(),
                    JWT_ACCESS_SECRET: joi.string().required(),
                    SMTP_TRANSPORT: joi.string().required(),
                    SMTP_FROM: joi.string().required(),
                }),
            }),
        ],
        providers: [client_config_service_1.ClientConfigService],
        exports: [client_config_service_1.ClientConfigService],
    })
], ClientConfigModule);


/***/ }),

/***/ "./libs/contracts/src/client-config/client-config.service.ts":
/*!*******************************************************************!*\
  !*** ./libs/contracts/src/client-config/client-config.service.ts ***!
  \*******************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ClientConfigService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const config_1 = __webpack_require__(/*! @nestjs/config */ "@nestjs/config");
const microservices_1 = __webpack_require__(/*! @nestjs/microservices */ "@nestjs/microservices");
let ClientConfigService = class ClientConfigService {
    config;
    constructor(config) {
        this.config = config;
    }
    get databaseTeamUrl() {
        return this.config.get('DATABASE_TEAM_URL', 'mongodb://localhost:27017/team');
    }
    get databaseProjectUrl() {
        return this.config.get('DATABASE_PROJECT_URL', 'postgres://postgres:postgres@localhost:5432/project_db');
    }
    get databaseTaskUrl() {
        return this.config.get('DATABASE_TASK_URL', 'postgres://postgres:postgres@localhost:5432/task_db');
    }
    get databaseLabelUrl() {
        return this.config.get('DATABASE_LABEL_URL', 'postgres://postgres:postgres@localhost:5432/label_db');
    }
    get databaseListUrl() {
        return this.config.get('DATABASE_LIST_URL', 'postgres://postgres:postgres@localhost:5432/list_db');
    }
    get databaseEpicUrl() {
        return this.config.get('DATABASE_EPIC_URL', 'postgres://postgres:postgres@localhost:5432/epic_db');
    }
    get databaseSprintUrl() {
        return this.config.get('DATABASE_SPRINT_URL', 'postgres://postgres:postgres@localhost:5432/sprint_db');
    }
    get databaseDiscussionUrl() {
        return this.config.get('DATABASE_DISCUSSION_URL', 'mongodb://localhost:27017/discussion');
    }
    getSMTPTransport() {
        return this.config.get('SMTP_TRANSPORT', 'smtps://user@domain.com:pass@smtp.domain.com');
    }
    getSMTPFrom() {
        return this.config.get('SMTP_FROM', 'user@domain.com');
    }
    getJWTSecret() {
        return this.config.get('JWT_ACCESS_SECRET', 'default_jwt_secret');
    }
    getRMQUrl() {
        return this.config.get('RMQ_URL', 'amqp://admin:admin123@localhost:5672');
    }
    getUserClientPort() {
        return this.config.get('USER_CLIENT_PORT', 3001);
    }
    getUserQueue() {
        return this.config.get('USER_QUEUE', 'user_service_queue');
    }
    get userClientOptions() {
        console.log('User port: ', this.getUserClientPort());
        return {
            transport: microservices_1.Transport.RMQ,
            options: {
                urls: [this.getRMQUrl()],
                queue: this.getUserQueue(),
                queueOptions: { durable: true },
            },
        };
    }
    getAuthClientPort() {
        return this.config.get('AUTH_CLIENT_PORT', 3002);
    }
    get authClientOptions() {
        console.log('Auth port: ', this.getAuthClientPort());
        return {
            transport: microservices_1.Transport.TCP,
            options: {
                port: this.getAuthClientPort(),
            },
        };
    }
    getTeamClientPort() {
        return this.config.get('TEAM_CLIENT_PORT', 3003);
    }
    getTeamQueue() {
        return this.config.get('TEAM_QUEUE', 'team_service_queue');
    }
    get teamClientOptions() {
        return {
            transport: microservices_1.Transport.RMQ,
            options: {
                urls: [this.getRMQUrl()],
                queue: this.getTeamQueue(),
                queueOptions: { durable: true },
            },
        };
    }
    getRedisClientPort() {
        return this.config.get('REDIS_CLIENT_PORT', 6379);
    }
    getRedisQueue() {
        return this.config.get('REDIS_QUEUE', 'redis_service_queue');
    }
    get redisClientOptions() {
        return {
            transport: microservices_1.Transport.RMQ,
            options: {
                urls: [this.getRMQUrl()],
                queue: this.getRedisQueue(),
                queueOptions: { durable: true },
            },
        };
    }
    getNotificationClientPort() {
        return this.config.get('NOTIFICATION_CLIENT_PORT', 4001);
    }
    getNotificationQueue() {
        return this.config.get('NOTIFICATION_QUEUE', 'notification_service_queue');
    }
    get notificationClientOptions() {
        console.log('Notification port: ', this.getNotificationClientPort());
        return {
            transport: microservices_1.Transport.RMQ,
            options: {
                urls: [this.getRMQUrl()],
                queue: this.getNotificationQueue(),
                queueOptions: { durable: true },
            },
        };
    }
    getTaskClientPort() {
        return this.config.get('TASK_CLIENT_PORT', 5001);
    }
    getTaskQueue() {
        return this.config.get('TASK_QUEUE', 'task_service_queue');
    }
    getTaskNerQueue() {
        return this.config.get('TASK_NER_QUEUE', 'process_nlp');
    }
    get taskClientOptions() {
        return {
            transport: microservices_1.Transport.RMQ,
            options: {
                urls: [this.getRMQUrl()],
                queue: this.getTaskQueue(),
                queueOptions: { durable: true },
            },
        };
    }
    get taskNerClientOptions() {
        return {
            transport: microservices_1.Transport.RMQ,
            options: {
                urls: [this.getRMQUrl()],
                queue: this.getTaskNerQueue(),
                queueOptions: { durable: true },
            },
        };
    }
    getGmailClientPort() {
        return this.config.get('GMAIL_CLIENT_PORT', 3005);
    }
    getGmailQueue() {
        return this.config.get('GMAIL_QUEUE', 'gmail_service_queue');
    }
    get gmailClientOptions() {
        console.log('Gmail port: ', this.getGmailClientPort());
        return {
            transport: microservices_1.Transport.RMQ,
            options: {
                urls: [this.getRMQUrl()],
                queue: this.getGmailQueue(),
                queueOptions: { durable: true },
            },
        };
    }
    getVideoChatClientPort() {
        return this.config.get('VIDEO_CHAT_CLIENT_PORT', 3004);
    }
    getVideoChatQueue() {
        return this.config.get('VIDEO_CHAT_QUEUE', 'video_chat_service_queue');
    }
    get videoChatClientOptions() {
        console.log('Video chat port: ', this.getVideoChatClientPort());
        return {
            transport: microservices_1.Transport.RMQ,
            options: {
                urls: [this.getRMQUrl()],
                queue: this.getVideoChatQueue(),
                queueOptions: { durable: true },
            },
        };
    }
    getChatbotDatabaseURL() {
        return this.config.get('CHATBOT_DATABASE_URL', 'mongodb://localhost:27017');
    }
    getChatbotClientPort() {
        return this.config.get('CHATBOT_CLIENT_PORT', 3006);
    }
    getChatbotQueue() {
        return this.config.get('CHATBOT_QUEUE', 'chatbot_service_queue');
    }
    get chatbotClientOptions() {
        return {
            transport: microservices_1.Transport.RMQ,
            options: {
                urls: [this.getRMQUrl()],
                queue: this.getChatbotQueue(),
                queueOptions: { durable: true },
            },
        };
    }
    getRagQueue() {
        return this.config.get('RAG_QUEUE', 'rag_queue');
    }
    get ragClientOptions() {
        return {
            transport: microservices_1.Transport.RMQ,
            options: {
                urls: [this.getRMQUrl()],
                queue: this.getRagQueue(),
                queueOptions: { durable: true },
            },
        };
    }
    getIngestionQueue() {
        return this.config.get('INGESTION_QUEUE', 'ingestion_queue');
    }
    get ingestionClientOptions() {
        return {
            transport: microservices_1.Transport.RMQ,
            options: {
                urls: [this.getRMQUrl()],
                queue: this.getIngestionQueue(),
                queueOptions: { durable: true },
            },
        };
    }
    getResponseQueue() {
        return this.config.get('RESPONSE_QUEUE', 'response_queue');
    }
    get responseClientOptions() {
        return {
            transport: microservices_1.Transport.RMQ,
            options: {
                urls: [this.getRMQUrl()],
                queue: this.getResponseQueue(),
                queueOptions: { durable: false },
            },
        };
    }
    getEndPointMinio() {
        return this.config.get('MINIO_ENDPOINT', 'http://localhost:9000');
    }
    getPortMinio() {
        return this.config.get('MINIO_PORT', 9000);
    }
    getUseSSLMinio() {
        const envValue = this.config.get('MINIO_USE_SSL', 'false');
        return envValue === 'true';
    }
    getAccessKeyMinio() {
        return this.config.get('MINIO_ACCESS_KEY', 'minio');
    }
    getSecretKeyMinio() {
        return this.config.get('MINIO_SECRET_KEY', 'minio123');
    }
    getBucketName() {
        return this.config.get('MINIO_BUCKET_NAME', 'documents');
    }
    getMinioPublicWebHook() {
        return this.config.get('MINIO_PUBLIC_WEBHOOK', 'http://localhost:3000/files/hooks/upload-completed');
    }
    getSocketPort() {
        return this.config.get('SOCKET_PORT', 4001);
    }
    getSocketQueue() {
        return this.config.get('SOCKET_QUEUE', 'socket_queue');
    }
    get socketClientOptions() {
        return {
            transport: microservices_1.Transport.RMQ,
            options: {
                urls: [this.getRMQUrl()],
                queue: this.getSocketQueue(),
                queueOptions: { durable: true },
            },
        };
    }
    getChatDatabaseUrl() {
        return this.config.get('DATABASE_CHAT_URL', 'mongodb://localhost:27017/chat');
    }
    getChatQueue() {
        return this.config.get('CHAT_QUEUE', 'chat_queue');
    }
    get chatClientOptions() {
        return {
            transport: microservices_1.Transport.RMQ,
            options: {
                urls: [this.getRMQUrl()],
                queue: this.getChatQueue(),
                queueOptions: { durable: true },
            },
        };
    }
    getSearchHost() {
        return this.config.get('SEARCH_HOST_URL', 'http://localhost:7700/');
    }
    getSearchApiKey() {
        return this.config.get('SEARCH_API_KEY', 'masterkey');
    }
    get searchClientOptions() {
        return {
            transport: microservices_1.Transport.RMQ,
            options: {
                urls: [this.getRMQUrl()],
                queue: 'search_queue',
                queueOptions: { durable: true },
            },
        };
    }
    getFileDatabaseUrl() {
        return this.config.get('DATABASE_FILE_URL', 'mongodb://localhost:27017/file');
    }
    getProjectClientQueue() {
        return this.config.get('PROJECT_QUEUE', 'project_service_queue');
    }
    get projectClientOptions() {
        return {
            transport: microservices_1.Transport.RMQ,
            options: {
                urls: [this.getRMQUrl()],
                queue: this.getProjectClientQueue(),
                queueOptions: { durable: true },
            },
        };
    }
    getListQueue() {
        return this.config.get('LIST_QUEUE', 'list_service_queue');
    }
    get listClientOptions() {
        return {
            transport: microservices_1.Transport.RMQ,
            options: {
                urls: [this.getRMQUrl()],
                queue: this.getListQueue(),
                queueOptions: { durable: true },
            },
        };
    }
    getEpicQueue() {
        return this.config.get('EPIC_QUEUE', 'epic_service_queue');
    }
    get epicClientOptions() {
        return {
            transport: microservices_1.Transport.RMQ,
            options: {
                urls: [this.getRMQUrl()],
                queue: this.getEpicQueue(),
                queueOptions: { durable: true },
            },
        };
    }
    getSprintQueue() {
        return this.config.get('SPRINT_QUEUE', 'sprint_service_queue');
    }
    get sprintClientOptions() {
        return {
            transport: microservices_1.Transport.RMQ,
            options: {
                urls: [this.getRMQUrl()],
                queue: this.getSprintQueue(),
                queueOptions: { durable: true },
            },
        };
    }
    getLabelQueue() {
        return this.config.get('LABEL_QUEUE', 'label_service_queue');
    }
    get labelClientOptions() {
        return {
            transport: microservices_1.Transport.RMQ,
            options: {
                urls: [this.getRMQUrl()],
                queue: this.getLabelQueue(),
                queueOptions: { durable: true },
            },
        };
    }
};
exports.ClientConfigService = ClientConfigService;
exports.ClientConfigService = ClientConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], ClientConfigService);


/***/ }),

/***/ "./libs/contracts/src/constants.ts":
/*!*****************************************!*\
  !*** ./libs/contracts/src/constants.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EVENTS_USER_QUEUE = exports.EVENTS_AUTH_QUEUE = exports.EVENTS_CHAT_QUEUE = exports.CHATBOT_QUEUE = exports.CHATBOT_EXCHANGE = exports.INGESTION_EXCHANGE = exports.RAG_EXCHANGE = exports.SEARCH_EXCHANGE = exports.SEARCH_QUEUE = exports.LABEL_EXCHANGE = exports.TASK_EXCHANGE = exports.SOCKET_QUEUE = exports.SOCKET_EXCHANGE = exports.NOTIFICATION_QUEUE = exports.NOTIFICATION_EXCHANGE = exports.GMAIL_QUEUE = exports.GMAIL_EXCHANGE = exports.USER_QUEUE = exports.REDIS_QUEUE = exports.REDIS_EXCHANGE = exports.USER_EXCHANGE = exports.CHAT_QUEUE = exports.DISCUSSION_EXCHANGE = exports.AUTH_QUEUE = exports.AUTH_EXCHANGE = exports.TEAM_EXCHANGE = exports.EVENTS_EXCHANGE = exports.EVENT_CLIENT = exports.DISCUSSION_CLIENT = exports.SOCKET_CLIENT = exports.RESPONSE_CLIENT = exports.INGESTION_CLIENT = exports.CHATBOT_CLIENT = exports.RAG_CLIENT = exports.VIDEO_CHAT_CLIENT_PORT = exports.VIDEO_CHAT_CLIENT = exports.TEAM_CLIENT = exports.TASK_NER_CLIENT = exports.GMAIL_CLIENT_PORT = exports.GMAIL_CLIENT = exports.PROJECT_CLIENT_PORT = exports.PROJECT_CLIENT = exports.NOTIFICATION_CLIENT_PORT = exports.NOTIFICATION_CLIENT = exports.REDIS_CLIENT_PORT = exports.REDIS_CLIENT = exports.USER_CLIENT_PORT = exports.USER_CLIENT = exports.AUTH_CLIENT_PORT = exports.AUTH_CLIENT = void 0;
exports.SOCKET_SERVICE = exports.REDIS_SERVICE = exports.SEARCH_SERVICE = exports.CHATBOT_SERVICE = exports.GMAIL_SERVICE = exports.VIDEO_CHAT_SERVICE = exports.AI_DISCUSSION_SERVICE = exports.DISCUSSION_SERVICE = exports.NOTIFICATION_SERVICE = exports.FILE_SERVICE = exports.LABEL_SERVICE = exports.STATUS_SERVICE = exports.EPIC_SERVICE = exports.SPRINT_SERVICE = exports.TASK_SERVICE = exports.PROJECT_SERVICE = exports.TEAM_SERVICE = exports.USER_SERVICE = exports.AUTH_SERVICE = exports.RPC_TIMEOUT = exports.LIST_EXCHANGE = exports.EPIC_EXCHANGE = exports.SPRINT_EXCHANGE = exports.PROJECT_EXCHANGE = exports.FILE_EXCHANGE = exports.TOPIC_EXCHANGE = exports.DIRECT_EXCHANGE = exports.EVENTS_CHATBOT_QUEUE = exports.EVENTS_SOCKET_QUEUE = exports.EVENTS_SEARCH_QUEUE = exports.EVENTS_TASK_QUEUE = exports.EVENTS_NOTIFICATION_QUEUE = exports.EVENTS_GMAIL_QUEUE = void 0;
exports.AUTH_CLIENT = Symbol('AUTH_CLIENT');
exports.AUTH_CLIENT_PORT = 3002;
exports.USER_CLIENT = Symbol('USER_CLIENT');
exports.USER_CLIENT_PORT = 3001;
exports.REDIS_CLIENT = Symbol('REDIS_CLIENT');
exports.REDIS_CLIENT_PORT = 6379;
exports.NOTIFICATION_CLIENT = Symbol('NOTIFICATION_CLIENT');
exports.NOTIFICATION_CLIENT_PORT = 4001;
exports.PROJECT_CLIENT = Symbol('PROJECT_CLIENT');
exports.PROJECT_CLIENT_PORT = 3003;
exports.GMAIL_CLIENT = Symbol('GMAIL_CLIENT');
exports.GMAIL_CLIENT_PORT = 3005;
exports.TASK_NER_CLIENT = Symbol('TASK_NER_CLIENT');
exports.TEAM_CLIENT = Symbol('TEAM_CLIENT');
exports.VIDEO_CHAT_CLIENT = Symbol('VIDEO_CHAT_CLIENT');
exports.VIDEO_CHAT_CLIENT_PORT = 3004;
exports.RAG_CLIENT = Symbol('RAG_CLIENT');
exports.CHATBOT_CLIENT = Symbol('CHATBOT_CLIENT');
exports.INGESTION_CLIENT = Symbol('INGESTION_CLIENT');
exports.RESPONSE_CLIENT = Symbol('RESPONSE_CLIENT');
exports.SOCKET_CLIENT = Symbol('SOCKET_CLIENT');
exports.DISCUSSION_CLIENT = Symbol('DISCUSSION_CLIENT');
exports.EVENT_CLIENT = Symbol('EVENT_CLIENT');
exports.EVENTS_EXCHANGE = "events_exchange";
exports.TEAM_EXCHANGE = "team_exchange";
exports.AUTH_EXCHANGE = 'auth_exchange';
exports.AUTH_QUEUE = 'auth_queue';
exports.DISCUSSION_EXCHANGE = 'discussion_exchange';
exports.CHAT_QUEUE = 'chat_queue';
exports.USER_EXCHANGE = 'user_exchange';
exports.REDIS_EXCHANGE = 'redis_exchange';
exports.REDIS_QUEUE = 'redis_queue';
exports.USER_QUEUE = 'user_queue';
exports.GMAIL_EXCHANGE = 'gmail_exchange';
exports.GMAIL_QUEUE = 'gmail_queue';
exports.NOTIFICATION_EXCHANGE = 'notification_exchange';
exports.NOTIFICATION_QUEUE = 'notification_queue';
exports.SOCKET_EXCHANGE = 'socket_exchange';
exports.SOCKET_QUEUE = 'socket_queue';
exports.TASK_EXCHANGE = 'task_exchange';
exports.LABEL_EXCHANGE = 'label_exchange';
exports.SEARCH_QUEUE = 'search_queue';
exports.SEARCH_EXCHANGE = 'search_exchange';
exports.RAG_EXCHANGE = 'rag_exchange';
exports.INGESTION_EXCHANGE = 'ingestion_exchange';
exports.CHATBOT_EXCHANGE = 'chatbot_exchange';
exports.CHATBOT_QUEUE = 'chatbot_queue';
exports.EVENTS_CHAT_QUEUE = 'events_chat_queue';
exports.EVENTS_AUTH_QUEUE = 'events_auth_queue';
exports.EVENTS_USER_QUEUE = 'events_user_queue';
exports.EVENTS_GMAIL_QUEUE = 'events_gmail_queue';
exports.EVENTS_NOTIFICATION_QUEUE = 'events_notification_queue';
exports.EVENTS_TASK_QUEUE = 'events_task_queue';
exports.EVENTS_SEARCH_QUEUE = 'events_search_queue';
exports.EVENTS_SOCKET_QUEUE = 'events_socket_queue';
exports.EVENTS_CHATBOT_QUEUE = 'events_chatbot_queue';
exports.DIRECT_EXCHANGE = 'direct_exchange';
exports.TOPIC_EXCHANGE = 'topic_exchange';
exports.FILE_EXCHANGE = 'file_exchange';
exports.PROJECT_EXCHANGE = 'project_exchange';
exports.SPRINT_EXCHANGE = 'sprint_exchange';
exports.EPIC_EXCHANGE = 'epic_exchange';
exports.LIST_EXCHANGE = 'list_exchange';
exports.RPC_TIMEOUT = 10000;
exports.AUTH_SERVICE = 'auth';
exports.USER_SERVICE = 'user';
exports.TEAM_SERVICE = 'team';
exports.PROJECT_SERVICE = 'project';
exports.TASK_SERVICE = 'task';
exports.SPRINT_SERVICE = 'sprint';
exports.EPIC_SERVICE = 'epic';
exports.STATUS_SERVICE = 'status';
exports.LABEL_SERVICE = 'label';
exports.FILE_SERVICE = 'file';
exports.NOTIFICATION_SERVICE = 'notification';
exports.DISCUSSION_SERVICE = 'discussion';
exports.AI_DISCUSSION_SERVICE = 'ai-discussion';
exports.VIDEO_CHAT_SERVICE = 'video-chat';
exports.GMAIL_SERVICE = 'gmail';
exports.CHATBOT_SERVICE = 'chatbot';
exports.SEARCH_SERVICE = 'search';
exports.REDIS_SERVICE = 'redis';
exports.SOCKET_SERVICE = 'socket';


/***/ }),

/***/ "./libs/contracts/src/discussion/discussion.pattern.dto.ts":
/*!*****************************************************************!*\
  !*** ./libs/contracts/src/discussion/discussion.pattern.dto.ts ***!
  \*****************************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DISCUSSION_PATTERN = void 0;
exports.DISCUSSION_PATTERN = {
    CREATE: 'chat.createDiscussion',
    CREATE_MESSAGE: 'chat.createMessage',
    CREATE_DIRECT_MESSAGE: 'chat.createDirectMessage',
    GET: 'chat.getDiscussion',
    GET_DISCUSSION_BY_ID: 'chat.getDiscussionById',
    GET_DISCUSSION_BY_TEAM_ID: 'chat.getDiscussionByTeamId',
    GET_MESSAGES: 'chat.getMessagesFromDiscussion',
    GET_ALL_MESSAGES: 'chat.getAllMessages',
    UPDATE_USER: 'chat.updateUser',
    LEAVE_TEAM: 'chat.leaveTeam',
    REMOVE_MEMBER: 'chat.removeMember',
    ADD_MEMBER: 'chat.addMember',
    SEARCH_MESSAGES: 'chat.searchMessages',
};


/***/ }),

/***/ "./libs/contracts/src/discussion/dto/create-direct-discussion.dto.ts":
/*!***************************************************************************!*\
  !*** ./libs/contracts/src/discussion/dto/create-direct-discussion.dto.ts ***!
  \***************************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateDirectDiscussionDto = void 0;
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
class CreateDirectDiscussionDto {
    senderId;
    partnerId;
}
exports.CreateDirectDiscussionDto = CreateDirectDiscussionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDirectDiscussionDto.prototype, "senderId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDirectDiscussionDto.prototype, "partnerId", void 0);


/***/ }),

/***/ "./libs/contracts/src/discussion/dto/create-discussion.dto.ts":
/*!********************************************************************!*\
  !*** ./libs/contracts/src/discussion/dto/create-discussion.dto.ts ***!
  \********************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateChatDto = void 0;
const class_transformer_1 = __webpack_require__(/*! class-transformer */ "class-transformer");
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
const participant_dto_1 = __webpack_require__(/*! ./participant.dto */ "./libs/contracts/src/discussion/dto/participant.dto.ts");
class CreateChatDto {
    participants;
    name;
}
exports.CreateChatDto = CreateChatDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => participant_dto_1.ParticipantDto),
    __metadata("design:type", Array)
], CreateChatDto.prototype, "participants", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateChatDto.prototype, "name", void 0);


/***/ }),

/***/ "./libs/contracts/src/discussion/dto/create-message.dto.ts":
/*!*****************************************************************!*\
  !*** ./libs/contracts/src/discussion/dto/create-message.dto.ts ***!
  \*****************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateMessageDto = exports.SenderSnapshotDto = exports.SENDER_SNAPSHOT_SYSTEM = void 0;
const membership_enum_1 = __webpack_require__(/*! @app/contracts/enums/membership.enum */ "./libs/contracts/src/enums/membership.enum.ts");
const class_transformer_1 = __webpack_require__(/*! class-transformer */ "class-transformer");
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
exports.SENDER_SNAPSHOT_SYSTEM = {
    _id: 'SYSTEM_ID',
    name: 'System',
    avatar: '',
    status: membership_enum_1.MemberShip.ACTIVE
};
class AttachmentDto {
    url;
    type;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AttachmentDto.prototype, "url", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AttachmentDto.prototype, "type", void 0);
class SenderSnapshotDto {
    _id;
    name;
    avatar;
    status;
}
exports.SenderSnapshotDto = SenderSnapshotDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SenderSnapshotDto.prototype, "_id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SenderSnapshotDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SenderSnapshotDto.prototype, "avatar", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(membership_enum_1.MemberShip),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", typeof (_a = typeof membership_enum_1.MemberShip !== "undefined" && membership_enum_1.MemberShip.ACTIVE) === "function" ? _a : Object)
], SenderSnapshotDto.prototype, "status", void 0);
class CreateMessageDto {
    discussionId;
    userId;
    content;
    teamId;
    attachments;
}
exports.CreateMessageDto = CreateMessageDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateMessageDto.prototype, "discussionId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateMessageDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateMessageDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateMessageDto.prototype, "teamId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => AttachmentDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateMessageDto.prototype, "attachments", void 0);


/***/ }),

/***/ "./libs/contracts/src/discussion/dto/get-messages.dto.ts":
/*!***************************************************************!*\
  !*** ./libs/contracts/src/discussion/dto/get-messages.dto.ts ***!
  \***************************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetMessageDiscussionDto = void 0;
class GetMessageDiscussionDto {
    discussionId;
    userId;
    page = 1;
    limit = 20;
}
exports.GetMessageDiscussionDto = GetMessageDiscussionDto;


/***/ }),

/***/ "./libs/contracts/src/discussion/dto/message.dto.ts":
/*!**********************************************************!*\
  !*** ./libs/contracts/src/discussion/dto/message.dto.ts ***!
  \**********************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MessageSnapshot = exports.AttachmentDto = void 0;
class AttachmentDto {
    type;
    name;
    url;
}
exports.AttachmentDto = AttachmentDto;
class MessageSnapshot {
    _id;
    content;
    attachments;
    sender;
    createdAt;
}
exports.MessageSnapshot = MessageSnapshot;


/***/ }),

/***/ "./libs/contracts/src/discussion/dto/participant.dto.ts":
/*!**************************************************************!*\
  !*** ./libs/contracts/src/discussion/dto/participant.dto.ts ***!
  \**************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ParticipantDto = void 0;
const member_role_enum_1 = __webpack_require__(/*! @app/contracts/enums/member-role.enum */ "./libs/contracts/src/enums/member-role.enum.ts");
const membership_enum_1 = __webpack_require__(/*! @app/contracts/enums/membership.enum */ "./libs/contracts/src/enums/membership.enum.ts");
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
class ParticipantDto {
    _id;
    name;
    avatar;
    role;
    status;
}
exports.ParticipantDto = ParticipantDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ParticipantDto.prototype, "_id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ParticipantDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ParticipantDto.prototype, "avatar", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(member_role_enum_1.MemberRole),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", typeof (_a = typeof member_role_enum_1.MemberRole !== "undefined" && member_role_enum_1.MemberRole) === "function" ? _a : Object)
], ParticipantDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(membership_enum_1.MemberShip),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_b = typeof membership_enum_1.MemberShip !== "undefined" && membership_enum_1.MemberShip) === "function" ? _b : Object)
], ParticipantDto.prototype, "status", void 0);


/***/ }),

/***/ "./libs/contracts/src/discussion/dto/response-message.dto.ts":
/*!*******************************************************************!*\
  !*** ./libs/contracts/src/discussion/dto/response-message.dto.ts ***!
  \*******************************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ResponseMessageDto = void 0;
class ResponseMessageDto {
    _id;
    discussionId;
    message;
}
exports.ResponseMessageDto = ResponseMessageDto;


/***/ }),

/***/ "./libs/contracts/src/discussion/dto/send-message.dto.ts":
/*!***************************************************************!*\
  !*** ./libs/contracts/src/discussion/dto/send-message.dto.ts ***!
  \***************************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
class AttachmentDto {
    url;
    type;
    fileName;
}
class SenderSnapshot {
    _id;
    name;
    avatar;
    status;
}
class MessageSnapshot {
    _id;
    content;
    attachments;
    sender;
    createdAt;
}


/***/ }),

/***/ "./libs/contracts/src/email/email.errors.ts":
/*!**************************************************!*\
  !*** ./libs/contracts/src/email/email.errors.ts ***!
  \**************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EmailErrorCode = void 0;
var EmailErrorCode;
(function (EmailErrorCode) {
    EmailErrorCode["FETCH_FAILED"] = "EMAIL_FETCH_FAILED";
})(EmailErrorCode || (exports.EmailErrorCode = EmailErrorCode = {}));


/***/ }),

/***/ "./libs/contracts/src/email/email.patterns.ts":
/*!****************************************************!*\
  !*** ./libs/contracts/src/email/email.patterns.ts ***!
  \****************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EMAIL_PATTERNS = void 0;
exports.EMAIL_PATTERNS = {
    FETCH_UNREAD: 'email.fetchUnread',
};


/***/ }),

/***/ "./libs/contracts/src/enum.ts":
/*!************************************!*\
  !*** ./libs/contracts/src/enum.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FileStatus = void 0;
var FileStatus;
(function (FileStatus) {
    FileStatus["UPLOADING"] = "uploading";
    FileStatus["UPLOADED"] = "uploaded";
    FileStatus["FAILED"] = "failed";
    FileStatus["DELETED"] = "deleted";
    FileStatus["PENDING"] = "pending";
    FileStatus["PROCESSED"] = "processed";
    FileStatus["UPDATING"] = "updating";
    FileStatus["UPDATED"] = "updated";
    FileStatus["COMPLETED"] = "completed";
})(FileStatus || (exports.FileStatus = FileStatus = {}));


/***/ }),

/***/ "./libs/contracts/src/enums.ts":
/*!*************************************!*\
  !*** ./libs/contracts/src/enums.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ListCategoryEnum = exports.EpicStatus = exports.SprintStatus = exports.TeamAction = exports.CallType = exports.NotificationType = exports.MemberShip = exports.ProjectVisibility = exports.MemberRole = exports.TeamStatus = exports.Provider = exports.Role = void 0;
var Role;
(function (Role) {
    Role["ADMIN"] = "ADMIN";
    Role["USER"] = "USER";
})(Role || (exports.Role = Role = {}));
var Provider;
(function (Provider) {
    Provider["LOCAL"] = "LOCAL";
    Provider["GOOGLE"] = "GOOGLE";
    Provider["FACEBOOK"] = "FACEBOOK";
    Provider["users"] = "users";
})(Provider || (exports.Provider = Provider = {}));
var TeamStatus;
(function (TeamStatus) {
    TeamStatus["ACTIVE"] = "ACTIVE";
    TeamStatus["ARCHIVED"] = "ARCHIVED";
    TeamStatus["DISBANDED"] = "DISBANDED";
    TeamStatus["DELETED"] = "DELETED";
})(TeamStatus || (exports.TeamStatus = TeamStatus = {}));
var MemberRole;
(function (MemberRole) {
    MemberRole["OWNER"] = "OWNER";
    MemberRole["ADMIN"] = "ADMIN";
    MemberRole["MEMBER"] = "MEMBER";
    MemberRole["SYSTEM"] = "SYSTEM";
    MemberRole["AI"] = "AI";
})(MemberRole || (exports.MemberRole = MemberRole = {}));
var ProjectVisibility;
(function (ProjectVisibility) {
    ProjectVisibility["PRIVATE"] = "PRIVATE";
    ProjectVisibility["TEAM"] = "TEAM";
    ProjectVisibility["PUBLIC"] = "PUBLIC";
})(ProjectVisibility || (exports.ProjectVisibility = ProjectVisibility = {}));
var MemberShip;
(function (MemberShip) {
    MemberShip["ACTIVE"] = "ACTIVE";
    MemberShip["LEFT"] = "LEFT";
})(MemberShip || (exports.MemberShip = MemberShip = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["SUCCESS"] = "SUCCESS";
    NotificationType["FAILED"] = "FAILED";
    NotificationType["INFO"] = "INFO";
    NotificationType["WARNING"] = "WARNING";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var CallType;
(function (CallType) {
    CallType["TEAM_CALL"] = "TEAM_CALL";
    CallType["DIRECT_CALL"] = "DIRECT_CALL";
})(CallType || (exports.CallType = CallType = {}));
var TeamAction;
(function (TeamAction) {
    TeamAction["TEAM_CREATED"] = "TEAM_CREATED";
    TeamAction["TEAM_UPDATED"] = "TEAM_UPDATED";
    TeamAction["MEMBER_ADDED"] = "MEMBER_ADDED";
    TeamAction["MEMBER_REMOVED"] = "MEMBER_REMOVED";
    TeamAction["PROJECT_CREATED"] = "PROJECT_CREATED";
    TeamAction["PROJECT_DELETED"] = "PROJECT_DELETED";
    TeamAction["TASK_CREATED"] = "TASK_CREATED";
    TeamAction["TASK_MOVED"] = "TASK_MOVED";
    TeamAction["TASK_COMPLETED"] = "TASK_COMPLETED";
})(TeamAction || (exports.TeamAction = TeamAction = {}));
var SprintStatus;
(function (SprintStatus) {
    SprintStatus["PLANNED"] = "planned";
    SprintStatus["ACTIVE"] = "active";
    SprintStatus["COMPLETED"] = "completed";
    SprintStatus["ARCHIVED"] = "archived";
})(SprintStatus || (exports.SprintStatus = SprintStatus = {}));
var EpicStatus;
(function (EpicStatus) {
    EpicStatus["TODO"] = "todo";
    EpicStatus["IN_PROGRESS"] = "in_progress";
    EpicStatus["DONE"] = "done";
    EpicStatus["CANCELED"] = "canceled";
})(EpicStatus || (exports.EpicStatus = EpicStatus = {}));
var ListCategoryEnum;
(function (ListCategoryEnum) {
    ListCategoryEnum["TODO"] = "todo";
    ListCategoryEnum["IN_PROGRESS"] = "in_progress";
    ListCategoryEnum["DONE"] = "done";
})(ListCategoryEnum || (exports.ListCategoryEnum = ListCategoryEnum = {}));


/***/ }),

/***/ "./libs/contracts/src/enums/epic-status.enum.ts":
/*!******************************************************!*\
  !*** ./libs/contracts/src/enums/epic-status.enum.ts ***!
  \******************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EpicStatus = void 0;
var EpicStatus;
(function (EpicStatus) {
    EpicStatus["TODO"] = "todo";
    EpicStatus["IN_PROGRESS"] = "in_progress";
    EpicStatus["DONE"] = "done";
    EpicStatus["CANCELED"] = "canceled";
})(EpicStatus || (exports.EpicStatus = EpicStatus = {}));


/***/ }),

/***/ "./libs/contracts/src/enums/list-category.enum.ts":
/*!********************************************************!*\
  !*** ./libs/contracts/src/enums/list-category.enum.ts ***!
  \********************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ListCategoryEnum = void 0;
var ListCategoryEnum;
(function (ListCategoryEnum) {
    ListCategoryEnum["TODO"] = "todo";
    ListCategoryEnum["IN_PROGRESS"] = "in_progress";
    ListCategoryEnum["DONE"] = "done";
})(ListCategoryEnum || (exports.ListCategoryEnum = ListCategoryEnum = {}));


/***/ }),

/***/ "./libs/contracts/src/enums/member-role.enum.ts":
/*!******************************************************!*\
  !*** ./libs/contracts/src/enums/member-role.enum.ts ***!
  \******************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MemberRole = void 0;
var MemberRole;
(function (MemberRole) {
    MemberRole["OWNER"] = "OWNER";
    MemberRole["ADMIN"] = "ADMIN";
    MemberRole["MEMBER"] = "MEMBER";
    MemberRole["SYSTEM"] = "SYSTEM";
    MemberRole["AI"] = "AI";
})(MemberRole || (exports.MemberRole = MemberRole = {}));


/***/ }),

/***/ "./libs/contracts/src/enums/membership.enum.ts":
/*!*****************************************************!*\
  !*** ./libs/contracts/src/enums/membership.enum.ts ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MemberShip = void 0;
var MemberShip;
(function (MemberShip) {
    MemberShip["ACTIVE"] = "ACTIVE";
    MemberShip["LEFT"] = "LEFT";
})(MemberShip || (exports.MemberShip = MemberShip = {}));


/***/ }),

/***/ "./libs/contracts/src/enums/priority.enum.ts":
/*!***************************************************!*\
  !*** ./libs/contracts/src/enums/priority.enum.ts ***!
  \***************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Priority = void 0;
var Priority;
(function (Priority) {
    Priority["LOW"] = "low";
    Priority["MEDIUM"] = "medium";
    Priority["HIGH"] = "high";
    Priority["URGENT"] = "urgent";
})(Priority || (exports.Priority = Priority = {}));


/***/ }),

/***/ "./libs/contracts/src/enums/project-visibility.enum.ts":
/*!*************************************************************!*\
  !*** ./libs/contracts/src/enums/project-visibility.enum.ts ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ProjectVisibility = void 0;
var ProjectVisibility;
(function (ProjectVisibility) {
    ProjectVisibility["PRIVATE"] = "PRIVATE";
    ProjectVisibility["TEAM"] = "TEAM";
    ProjectVisibility["PUBLIC"] = "PUBLIC";
})(ProjectVisibility || (exports.ProjectVisibility = ProjectVisibility = {}));


/***/ }),

/***/ "./libs/contracts/src/epic/create-epic.dto.ts":
/*!****************************************************!*\
  !*** ./libs/contracts/src/epic/create-epic.dto.ts ***!
  \****************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateEpicDto = void 0;
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const priority_enum_1 = __webpack_require__(/*! ../enums/priority.enum */ "./libs/contracts/src/enums/priority.enum.ts");
const epic_status_enum_1 = __webpack_require__(/*! ../enums/epic-status.enum */ "./libs/contracts/src/enums/epic-status.enum.ts");
class CreateEpicDto {
    title;
    description;
    status;
    priority;
    projectId;
    sprintId;
    start_date;
    due_date;
    memberIds;
}
exports.CreateEpicDto = CreateEpicDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'User Authentication Epic',
        description: 'Tên của epic',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEpicDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'Implement user authentication flow including login, register, and password reset',
        description: 'Mô tả chi tiết về epic',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateEpicDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: epic_status_enum_1.EpicStatus,
        example: 'todo',
        description: 'Trạng thái của epic',
    }),
    (0, class_validator_1.IsEnum)(epic_status_enum_1.EpicStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_a = typeof epic_status_enum_1.EpicStatus !== "undefined" && epic_status_enum_1.EpicStatus) === "function" ? _a : Object)
], CreateEpicDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: priority_enum_1.Priority,
        example: 'high',
        description: 'Độ ưu tiên của epic',
    }),
    (0, class_validator_1.IsEnum)(priority_enum_1.Priority),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_b = typeof priority_enum_1.Priority !== "undefined" && priority_enum_1.Priority) === "function" ? _b : Object)
], CreateEpicDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '608aa21d-e730-4e02-b731-a20146cc6e38',
        description: 'ID của dự án chứa epic này',
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEpicDto.prototype, "projectId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: '660e8400-e29b-41d4-a716-446655440000',
        description: 'ID của sprint chứa epic này (nếu có)',
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateEpicDto.prototype, "sprintId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: '2025-12-01T00:00:00.000Z',
        description: 'Ngày bắt đầu dự kiến của epic (ISO format)',
    }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateEpicDto.prototype, "start_date", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: '2025-12-31T23:59:59.000Z',
        description: 'Hạn chót hoàn thành epic (ISO format)',
    }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateEpicDto.prototype, "due_date", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateEpicDto.prototype, "memberIds", void 0);


/***/ }),

/***/ "./libs/contracts/src/epic/entity/epic.entity.ts":
/*!*******************************************************!*\
  !*** ./libs/contracts/src/epic/entity/epic.entity.ts ***!
  \*******************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Epic = void 0;
const epic_status_enum_1 = __webpack_require__(/*! @app/contracts/enums/epic-status.enum */ "./libs/contracts/src/enums/epic-status.enum.ts");
const priority_enum_1 = __webpack_require__(/*! @app/contracts/enums/priority.enum */ "./libs/contracts/src/enums/priority.enum.ts");
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
let Epic = class Epic {
    id;
    title;
    description;
    color;
    status;
    priority;
    startDate;
    dueDate;
    projectId;
    createdAt;
    updatedAt;
};
exports.Epic = Epic;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Epic.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Epic.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Epic.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Epic.prototype, "color", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: epic_status_enum_1.EpicStatus,
        default: epic_status_enum_1.EpicStatus.TODO,
    }),
    __metadata("design:type", typeof (_a = typeof epic_status_enum_1.EpicStatus !== "undefined" && epic_status_enum_1.EpicStatus) === "function" ? _a : Object)
], Epic.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: priority_enum_1.Priority,
        nullable: true,
        default: priority_enum_1.Priority.MEDIUM,
    }),
    __metadata("design:type", typeof (_b = typeof priority_enum_1.Priority !== "undefined" && priority_enum_1.Priority) === "function" ? _b : Object)
], Epic.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'start_date', nullable: true }),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], Epic.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'due_date', nullable: true }),
    __metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
], Epic.prototype, "dueDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'project_id' }),
    __metadata("design:type", String)
], Epic.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", typeof (_e = typeof Date !== "undefined" && Date) === "function" ? _e : Object)
], Epic.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", typeof (_f = typeof Date !== "undefined" && Date) === "function" ? _f : Object)
], Epic.prototype, "updatedAt", void 0);
exports.Epic = Epic = __decorate([
    (0, typeorm_1.Entity)('epics')
], Epic);


/***/ }),

/***/ "./libs/contracts/src/epic/epic.patterns.ts":
/*!**************************************************!*\
  !*** ./libs/contracts/src/epic/epic.patterns.ts ***!
  \**************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EPIC_PATTERNS = void 0;
exports.EPIC_PATTERNS = {
    CREATE: 'epic.create',
    FIND_ALL_BY_PROJECT_ID: 'epic.findAllByProjectId',
    UPDATE: 'epic.update',
    REMOVE: 'epic.remove',
    FIND_ONE_BY_ID: 'epic.findOneById',
};


/***/ }),

/***/ "./libs/contracts/src/epic/update-epic.dto.ts":
/*!****************************************************!*\
  !*** ./libs/contracts/src/epic/update-epic.dto.ts ***!
  \****************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdateEpicDto = void 0;
const mapped_types_1 = __webpack_require__(/*! @nestjs/mapped-types */ "@nestjs/mapped-types");
const create_epic_dto_1 = __webpack_require__(/*! ./create-epic.dto */ "./libs/contracts/src/epic/create-epic.dto.ts");
class UpdateEpicDto extends (0, mapped_types_1.PartialType)(create_epic_dto_1.CreateEpicDto) {
}
exports.UpdateEpicDto = UpdateEpicDto;


/***/ }),

/***/ "./libs/contracts/src/error.ts":
/*!*************************************!*\
  !*** ./libs/contracts/src/error.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BadRequestException = exports.ConflictException = exports.NotFoundException = exports.SerializableRpcException = exports.ForbiddenException = exports.UnauthorizedException = void 0;
const microservices_1 = __webpack_require__(/*! @nestjs/microservices */ "@nestjs/microservices");
class UnauthorizedException extends microservices_1.RpcException {
    constructor(message = 'Unauthorized') {
        super({ error: 'Unauthorized', statusCode: 401, message });
    }
}
exports.UnauthorizedException = UnauthorizedException;
class ForbiddenException extends microservices_1.RpcException {
    constructor(message = 'Forbidden') {
        super({ error: 'Forbidden', statusCode: 403, message });
    }
}
exports.ForbiddenException = ForbiddenException;
class SerializableRpcException extends microservices_1.RpcException {
    constructor(error) {
        if (typeof error !== 'string') {
            error = JSON.stringify(error);
        }
        super(error);
    }
}
exports.SerializableRpcException = SerializableRpcException;
class NotFoundException extends microservices_1.RpcException {
    constructor(message = 'Not found') {
        super({ error: 'Not found', statusCode: 404, message });
    }
}
exports.NotFoundException = NotFoundException;
class ConflictException extends microservices_1.RpcException {
    constructor(message = 'Conflict') {
        super({ error: 'Conflict', statusCode: 409, message });
    }
}
exports.ConflictException = ConflictException;
class BadRequestException extends microservices_1.RpcException {
    constructor(message = 'Bad request') {
        super({ error: 'Bad request', statusCode: 400, message });
    }
}
exports.BadRequestException = BadRequestException;


/***/ }),

/***/ "./libs/contracts/src/events/events.pattern.ts":
/*!*****************************************************!*\
  !*** ./libs/contracts/src/events/events.pattern.ts ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EVENTS = void 0;
exports.EVENTS = {
    REGISTER: 'events.register',
    LOGIN: 'events.login',
    USER_UPDATED: 'events.user.updated',
    CREATE_TEAM: 'events.create.team',
    CREATE_CONVERSATION: 'events.create.conversation',
    ADD_MEMBER: 'events.add.member',
    REMOVE_MEMBER: 'events.remove.member',
    LEAVE_TEAM: 'events.leave.team',
    REMOVE_TEAM: 'events.remove.team',
    MEMBER_ROLE_CHANGED: 'events.member.role.changed',
    OWNERSHIP_TRANSFERRED: 'events.ownership.transferred',
    NEW_MESSAGE: 'events.new.message',
    DELETE_DOCUMENT: 'events.delete.document',
    RENAME_TEAM: 'events.rename.team',
};


/***/ }),

/***/ "./libs/contracts/src/file/dto/delete-file.dto.ts":
/*!********************************************************!*\
  !*** ./libs/contracts/src/file/dto/delete-file.dto.ts ***!
  \********************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DeleteFilePayload = void 0;
class DeleteFilePayload {
    fileId;
    userId;
    teamId;
}
exports.DeleteFilePayload = DeleteFilePayload;


/***/ }),

/***/ "./libs/contracts/src/file/dto/update-file.dto.ts":
/*!********************************************************!*\
  !*** ./libs/contracts/src/file/dto/update-file.dto.ts ***!
  \********************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdateFilePayload = void 0;
class UpdateFilePayload {
    fileId;
    newFileName;
    userId;
    teamId;
}
exports.UpdateFilePayload = UpdateFilePayload;


/***/ }),

/***/ "./libs/contracts/src/file/dto/upload-file.dto.ts":
/*!********************************************************!*\
  !*** ./libs/contracts/src/file/dto/upload-file.dto.ts ***!
  \********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UploadFilePayload = void 0;
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
class UploadFilePayload {
    fileName;
    userId;
    teamId;
}
exports.UploadFilePayload = UploadFilePayload;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UploadFilePayload.prototype, "fileName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UploadFilePayload.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UploadFilePayload.prototype, "teamId", void 0);


/***/ }),

/***/ "./libs/contracts/src/file/file.pattern.ts":
/*!*************************************************!*\
  !*** ./libs/contracts/src/file/file.pattern.ts ***!
  \*************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FILE_PATTERN = void 0;
exports.FILE_PATTERN = {
    CREATE_FILE: 'file.create',
    UPDATE_FILE: 'file.update',
    DELETE_FILE: 'file.delete',
    UPLOAD_FILE: 'file.upload',
    DOWNLOAD_FILE: 'file.download',
    RENAME: 'file.rename',
    GET_FILE: 'file.get',
    GET_FILE_BY_USER_ID: 'file.get.userId',
    GET_FILE_BY_TEAM_ID: 'file.get.teamId',
    GET_FILES: 'file.get.all',
    GET_PREVIEW_URL: 'file.preview.url',
    GET_DOWNLOAD_URL: 'file.download.url',
    INITIAL_UPLOAD: 'file.initial.upload',
    INITIAL_UPDATE: 'file.initial.update',
    COMPLETE_UPLOAD: 'file.complete.upload',
    COMPLETE_UPDATE: 'file.complete.update',
    FILE_STATUS: 'file.status',
};


/***/ }),

/***/ "./libs/contracts/src/gmail/dto/send-email.dto.ts":
/*!********************************************************!*\
  !*** ./libs/contracts/src/gmail/dto/send-email.dto.ts ***!
  \********************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SendEmailVerificationDto = void 0;
class SendEmailVerificationDto {
    user;
    url;
    code;
}
exports.SendEmailVerificationDto = SendEmailVerificationDto;


/***/ }),

/***/ "./libs/contracts/src/gmail/dto/send-mail.dto.ts":
/*!*******************************************************!*\
  !*** ./libs/contracts/src/gmail/dto/send-mail.dto.ts ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SendMailDto = exports.EmailSystemType = void 0;
var EmailSystemType;
(function (EmailSystemType) {
    EmailSystemType["LOGIN"] = "LOGIN";
    EmailSystemType["REGISTER"] = "REGISTER";
    EmailSystemType["PASSWORD_CHANGE"] = "PASSWORD_CHANGE";
    EmailSystemType["RESET_PASSWORD"] = "RESET_PASSWORD";
})(EmailSystemType || (exports.EmailSystemType = EmailSystemType = {}));
class SendMailDto {
    userId;
    to;
    subject;
    messageText;
    content;
    type;
}
exports.SendMailDto = SendMailDto;


/***/ }),

/***/ "./libs/contracts/src/gmail/email-subject.constant.ts":
/*!************************************************************!*\
  !*** ./libs/contracts/src/gmail/email-subject.constant.ts ***!
  \************************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.verificationEmailTemplate = exports.verificationEmailSubject = exports.resetPasswordNotificationTemplate = exports.resetPasswordNotificationSubject = exports.passwordChangeNotificationTemplate = exports.passwordChangeNotificationSubject = exports.registerNotificationTemplate = exports.registerNotificationSubject = exports.loginNotificationTemplate = exports.loginNotificationSubject = void 0;
const SUPPORT_EMAIL = 'example@gmail.com';
const APP_NAME = 'My App';
const LOGIN_URL = 'http://localhost:3000/auth/login';
exports.loginNotificationSubject = 'New sign-in detected';
const loginNotificationTemplate = (name, datetime, ip, securityUrl = '', supportEmail = SUPPORT_EMAIL) => `
<!doctype html>
<html>
  <body style="font-family:Arial,Helvetica,sans-serif;margin:0;padding:0;background:#f5f7fb;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:20px 0;">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:24px;text-align:left;">
                <h2 style="margin:0 0 8px;font-size:20px;color:#0f172a;">New sign-in detected</h2>
                <p style="margin:0 0 16px;color:#374151;">Hi ${name},</p>
                <p style="margin:0 0 12px;color:#374151;">
                  We detected a login to your account on <strong>${datetime}</strong> from IP <strong>${ip}</strong>.
                </p>
                <p style="margin:0 0 16px;color:#374151;">
                  If this was you, no action is needed. If you don't recognize this activity, please <a href="${securityUrl}" style="color:#2563eb;text-decoration:none;">secure your account</a> or contact us at <a href="mailto:${supportEmail}">${supportEmail}</a>.
                </p>

                <div style="margin-top:20px;">
                  <a href="${securityUrl}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">Secure account</a>
                </div>

                <hr style="margin:20px 0;border:none;border-top:1px solid #eef2ff;" />

                <p style="margin:0;color:#9ca3af;font-size:12px;">
                  If you have questions, reply to this email or contact <a href="mailto:${supportEmail}">${supportEmail}</a>.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
exports.loginNotificationTemplate = loginNotificationTemplate;
exports.registerNotificationSubject = 'New account created';
const registerNotificationTemplate = (name, loginUrl = LOGIN_URL, appName = APP_NAME, supportEmail = SUPPORT_EMAIL) => `
<!doctype html>
<html>
  <body style="font-family:Arial,Helvetica,sans-serif;margin:0;padding:0;background:#f7fafc;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:28px 0;">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;">
            <tr>
              <td style="padding:28px;text-align:center;">
                <h1 style="margin:0 0 8px;font-size:24px;color:#0f172a;">Welcome, ${name}!</h1>
                <p style="margin:0 0 16px;color:#374151;">Your account at <strong>${appName}</strong> is now active.</p>

                <p style="margin:0 0 20px;color:#374151;">Click below to sign in and get started.</p>

                <a href="${loginUrl}" style="display:inline-block;padding:12px 20px;background:#10b981;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Sign in to your account</a>

                <hr style="margin:22px 0;border:none;border-top:1px solid #eef2ff;" />

                <p style="margin:0;color:#9ca3af;font-size:13px;">
                  Questions? Contact <a href="mailto:${supportEmail}">${supportEmail}</a>.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
exports.registerNotificationTemplate = registerNotificationTemplate;
exports.passwordChangeNotificationSubject = 'Password changed';
const passwordChangeNotificationTemplate = (name, datetime, resetUrl = '', supportEmail = SUPPORT_EMAIL) => `
<!doctype html>
<html>
  <body style="font-family:Arial,Helvetica,sans-serif;margin:0;padding:0;background:#fffaf0;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:24px 0;">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:20px;">
                <h2 style="margin:0 0 8px;font-size:20px;color:#0f172a;">Password changed</h2>
                <p style="margin:0 0 12px;color:#374151;">Hi ${name},</p>
                <p style="margin:0 0 12px;color:#374151;">
                  Your account password was changed on <strong>${datetime}</strong>.
                </p>
                <p style="margin:0 0 16px;color:#374151;">
                  If you performed this change, no action is required. If not, please reset your password immediately:
                </p>

                <a href="${resetUrl}" style="display:inline-block;padding:10px 16px;background:#ef4444;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">Reset password</a>

                <hr style="margin:18px 0;border:none;border-top:1px solid #f3e8ff;" />

                <p style="margin:0;color:#9ca3af;font-size:12px;">
                  Need help? Contact <a href="mailto:${supportEmail}">${supportEmail}</a>.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
exports.passwordChangeNotificationTemplate = passwordChangeNotificationTemplate;
exports.resetPasswordNotificationSubject = 'Reset your password';
const resetPasswordNotificationTemplate = (name, expiryMinutes = 15, resetUrl = '', code = '', appName = APP_NAME, supportEmail = SUPPORT_EMAIL) => `
<!doctype html>
<html>
  <body style="font-family:Arial,Helvetica,sans-serif;margin:0;padding:0;background:#f8fafc;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:28px 0;">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;">
            <tr>
              <td style="padding:28px;text-align:left;">
                <h2 style="margin:0 0 8px;font-size:20px;color:#0f172a;">Reset your password</h2>
                <p style="margin:0 0 12px;color:#374151;">Hi ${name},</p>
                <p style="margin:0 0 12px;color:#374151;">
                  We received a request to reset the password for your ${appName} account.
                  You can use the verification code below, or click the reset button.
                  This code and link will expire in ${expiryMinutes} minutes.
                </p>

                <!-- CODE HIỂN THỊ TRƯỚC NÚT RESET -->
                <div style="margin:18px 0;text-align:center;">
                  <p style="margin:0 0 8px;color:#374151;">Your verification code:</p>
                  <div style="display:inline-block;padding:10px 16px;border:1px dashed #2563eb;border-radius:8px;font-size:18px;font-weight:bold;color:#2563eb;">
                    ${code}
                  </div>
                </div>

                <p style="margin:18px 0;text-align:center;">
                  <a href="${resetUrl}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">Reset password</a>
                </p>

                <p style="margin:0 0 12px;color:#374151;">
                  If you did not request a password reset, please ignore this email or contact <a href="mailto:${supportEmail}">${supportEmail}</a>.
                </p>

                <hr style="margin:20px 0;border:none;border-top:1px solid #eef2ff;" />
                <p style="margin:0;color:#9ca3af;font-size:12px;">
                  For your safety, do not share this code or link.
                  If the button doesn't work, you can also paste this URL into your browser: <br />
                  <a href="${resetUrl}" style="word-break:break-all;color:#2563eb;">${resetUrl}</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
exports.resetPasswordNotificationTemplate = resetPasswordNotificationTemplate;
exports.verificationEmailSubject = 'Verify your email address';
const verificationEmailTemplate = (name, verificationUrl, verificationCode, expiryMinutes = 24, appName = APP_NAME, supportEmail = SUPPORT_EMAIL) => `
<!doctype html>
<html>
  <body style="font-family:Arial,Helvetica,sans-serif;margin:0;padding:0;background:#f8fafc;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:28px 0;">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;">
            <tr>
              <td style="padding:28px;text-align:left;">
                <h2 style="margin:0 0 8px;font-size:20px;color:#0f172a;">Verify your email address</h2>
                <p style="margin:0 0 12px;color:#374151;">Hi ${name},</p>
                <p style="margin:0 0 12px;color:#374151;">
                  Welcome to <strong>${appName}</strong>! Please verify your email address to activate your account and start using all features.
                </p>
                <p style="margin:0 0 16px;color:#374151;">
                  You can verify your email by clicking the button below, or by entering the verification code on our application.
                  The link and code will expire in ${expiryMinutes} minutes for security reasons.
                </p>

                <p style="margin:20px 0 10px;color:#374151;text-align:center;font-size:16px;font-weight:600;">
                  Your verification code is:
                </p>
                <p style="margin:0 0 24px;text-align:center;">
                  <span style="display:inline-block;padding:12px 25px;background:#f1f5f9;color:#2563eb;font-size:24px;font-weight:700;border-radius:8px;letter-spacing:4px;border:1px dashed #cbd5e1;">
                    ${verificationCode}
                  </span>
                </p>

                <p style="margin:18px 0;text-align:center;">
                  <a href="${verificationUrl}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">Verify email address</a>
                </p>

                <p style="margin:0 0 12px;color:#374151;">
                  If the button doesn't work or you prefer to use the link directly:
                </p>
                <p style="margin:0 0 16px;color:#2563eb;word-break:break-all;font-size:14px;">
                  ${verificationUrl}
                </p>

                <p style="margin:0 0 12px;color:#374151;">
                  If you didn't create an account with ${appName}, please ignore this email or contact <a href="mailto:${supportEmail}">${supportEmail}</a>.
                </p>

                <hr style="margin:20px 0;border:none;border-top:1px solid #eef2ff;" />
                <p style="margin:0;color:#9ca3af;font-size:12px;">
                  For your security, do not share this verification link or code with anyone.
                  If you have questions, reply to this email or contact <a href="mailto:${supportEmail}">${supportEmail}</a>.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
exports.verificationEmailTemplate = verificationEmailTemplate;


/***/ }),

/***/ "./libs/contracts/src/gmail/gmail.errors.ts":
/*!**************************************************!*\
  !*** ./libs/contracts/src/gmail/gmail.errors.ts ***!
  \**************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GMAIL_ERRORS = void 0;
exports.GMAIL_ERRORS = {
    TOKEN_NOT_FOUND: {
        message: 'Không tìm thấy Google token cho người dùng.',
        code: 'GMAIL_001',
    },
    FETCH_UNREAD_FAILED: {
        message: 'Failed to fetch unread emails.',
        code: 'GMAIL_002',
    },
    SEND_MAIL_FAILED: {
        message: 'Failed to send email.',
        code: 'GMAIL_003',
    },
};


/***/ }),

/***/ "./libs/contracts/src/gmail/gmail.patterns.ts":
/*!****************************************************!*\
  !*** ./libs/contracts/src/gmail/gmail.patterns.ts ***!
  \****************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GMAIL_PATTERNS = void 0;
exports.GMAIL_PATTERNS = {
    GET_UNREAD_MAILS: 'get_unread_mails',
    SEND_MAIL: 'send_mail',
    SEND_VERIFICATION_EMAIL: 'send_verification_email',
    SEND_RESET_PASSWORD_EMAIL: 'send_reset_password_email',
    SEND_LOGIN_EMAIL: 'send_login_email',
    SEND_EMAIL_PASSWORD_CHANGE: 'send_email_password_change',
    SEND_EMAIL_REGISTER: 'send_email_register',
    SEND_EMAIL_RESET_PASSWORD: 'send_email_reset_password',
};


/***/ }),

/***/ "./libs/contracts/src/index.ts":
/*!*************************************!*\
  !*** ./libs/contracts/src/index.ts ***!
  \*************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
__exportStar(__webpack_require__(/*! ./enums */ "./libs/contracts/src/enums.ts"), exports);
__exportStar(__webpack_require__(/*! ./error */ "./libs/contracts/src/error.ts"), exports);
__exportStar(__webpack_require__(/*! ./constants */ "./libs/contracts/src/constants.ts"), exports);
__exportStar(__webpack_require__(/*! ./pagination.dto */ "./libs/contracts/src/pagination.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./enum */ "./libs/contracts/src/enum.ts"), exports);
__exportStar(__webpack_require__(/*! ./label/label.errors */ "./libs/contracts/src/label/label.errors.ts"), exports);
__exportStar(__webpack_require__(/*! ./list/list.errors */ "./libs/contracts/src/list/list.errors.ts"), exports);
__exportStar(__webpack_require__(/*! ./list/list.patterns */ "./libs/contracts/src/list/list.patterns.ts"), exports);
__exportStar(__webpack_require__(/*! ./list/create-list.dto */ "./libs/contracts/src/list/create-list.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./list/update-list.dto */ "./libs/contracts/src/list/update-list.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./auth/auth.patterns */ "./libs/contracts/src/auth/auth.patterns.ts"), exports);
__exportStar(__webpack_require__(/*! ./auth/jwt.constant */ "./libs/contracts/src/auth/jwt.constant.ts"), exports);
__exportStar(__webpack_require__(/*! ./auth/dto/account-google.dto */ "./libs/contracts/src/auth/dto/account-google.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./auth/dto/confirm-reset-password.dto */ "./libs/contracts/src/auth/dto/confirm-reset-password.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./auth/dto/create-auth-local.dto */ "./libs/contracts/src/auth/dto/create-auth-local.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./auth/dto/create-auth-oauth.dto */ "./libs/contracts/src/auth/dto/create-auth-oauth.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./auth/dto/create-auth.dto */ "./libs/contracts/src/auth/dto/create-auth.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./auth/dto/forgot-password.dto */ "./libs/contracts/src/auth/dto/forgot-password.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./auth/dto/jwt.dto */ "./libs/contracts/src/auth/dto/jwt.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./auth/dto/login-request.dto */ "./libs/contracts/src/auth/dto/login-request.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./auth/dto/login-response.dto */ "./libs/contracts/src/auth/dto/login-response.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./auth/dto/oauth-login.dto */ "./libs/contracts/src/auth/dto/oauth-login.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./auth/dto/reset-password.dto */ "./libs/contracts/src/auth/dto/reset-password.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./auth/dto/verify-account.dto */ "./libs/contracts/src/auth/dto/verify-account.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./discussion/dto/create-discussion.dto */ "./libs/contracts/src/discussion/dto/create-discussion.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./discussion/dto/create-direct-discussion.dto */ "./libs/contracts/src/discussion/dto/create-direct-discussion.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./discussion/dto/create-message.dto */ "./libs/contracts/src/discussion/dto/create-message.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./discussion/dto/get-messages.dto */ "./libs/contracts/src/discussion/dto/get-messages.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./discussion/dto/participant.dto */ "./libs/contracts/src/discussion/dto/participant.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./discussion/dto/create-direct-discussion.dto */ "./libs/contracts/src/discussion/dto/create-direct-discussion.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./discussion/dto/send-message.dto */ "./libs/contracts/src/discussion/dto/send-message.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./discussion/dto/response-message.dto */ "./libs/contracts/src/discussion/dto/response-message.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./discussion/dto/message.dto */ "./libs/contracts/src/discussion/dto/message.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./discussion/discussion.pattern.dto */ "./libs/contracts/src/discussion/discussion.pattern.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./chatbot/chatbot.pattern */ "./libs/contracts/src/chatbot/chatbot.pattern.ts"), exports);
__exportStar(__webpack_require__(/*! ./chatbot/dto/chatbot-document.dto */ "./libs/contracts/src/chatbot/dto/chatbot-document.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./chatbot/dto/conversation.dto */ "./libs/contracts/src/chatbot/dto/conversation.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./chatbot/dto/message-response.dto */ "./libs/contracts/src/chatbot/dto/message-response.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./chatbot/dto/response-stream.dto */ "./libs/contracts/src/chatbot/dto/response-stream.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./chatbot/dto/summarize-document.dto */ "./libs/contracts/src/chatbot/dto/summarize-document.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./chatbot/dto/ask-question.dto */ "./libs/contracts/src/chatbot/dto/ask-question.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./chatbot/dto/message.dto */ "./libs/contracts/src/chatbot/dto/message.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./client-config/client-config.module */ "./libs/contracts/src/client-config/client-config.module.ts"), exports);
__exportStar(__webpack_require__(/*! ./client-config/client-config.service */ "./libs/contracts/src/client-config/client-config.service.ts"), exports);
__exportStar(__webpack_require__(/*! ./email/email.patterns */ "./libs/contracts/src/email/email.patterns.ts"), exports);
__exportStar(__webpack_require__(/*! ./email/email.errors */ "./libs/contracts/src/email/email.errors.ts"), exports);
__exportStar(__webpack_require__(/*! ./gmail/gmail.errors */ "./libs/contracts/src/gmail/gmail.errors.ts"), exports);
__exportStar(__webpack_require__(/*! ./gmail/gmail.patterns */ "./libs/contracts/src/gmail/gmail.patterns.ts"), exports);
__exportStar(__webpack_require__(/*! ./gmail/email-subject.constant */ "./libs/contracts/src/gmail/email-subject.constant.ts"), exports);
__exportStar(__webpack_require__(/*! ./gmail/dto/send-mail.dto */ "./libs/contracts/src/gmail/dto/send-mail.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./gmail/dto/send-email.dto */ "./libs/contracts/src/gmail/dto/send-email.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./notification/notification.pattern */ "./libs/contracts/src/notification/notification.pattern.ts"), exports);
__exportStar(__webpack_require__(/*! ./notification/dto/notification-event.dto */ "./libs/contracts/src/notification/dto/notification-event.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./notification/dto/notification-update.dto */ "./libs/contracts/src/notification/dto/notification-update.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./redis/redis.pattern */ "./libs/contracts/src/redis/redis.pattern.ts"), exports);
__exportStar(__webpack_require__(/*! ./redis/store-refreshtoken.dto */ "./libs/contracts/src/redis/store-refreshtoken.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./task/task.patterns */ "./libs/contracts/src/task/task.patterns.ts"), exports);
__exportStar(__webpack_require__(/*! ./task/task.errors */ "./libs/contracts/src/task/task.errors.ts"), exports);
__exportStar(__webpack_require__(/*! ./task/entity/task.entity */ "./libs/contracts/src/task/entity/task.entity.ts"), exports);
__exportStar(__webpack_require__(/*! ./task/create-task.dto */ "./libs/contracts/src/task/create-task.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./task/update-task.dto */ "./libs/contracts/src/task/update-task.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./task/dto/request-google-task.dto */ "./libs/contracts/src/task/dto/request-google-task.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./project/create-project.dto */ "./libs/contracts/src/project/create-project.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./project/update-project.dto */ "./libs/contracts/src/project/update-project.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./project/entity/project.entity */ "./libs/contracts/src/project/entity/project.entity.ts"), exports);
__exportStar(__webpack_require__(/*! ./project/project.patterns */ "./libs/contracts/src/project/project.patterns.ts"), exports);
__exportStar(__webpack_require__(/*! ./sprint/create-sprint.dto */ "./libs/contracts/src/sprint/create-sprint.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./sprint/update-sprint.dto */ "./libs/contracts/src/sprint/update-sprint.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./sprint/sprint.patterns */ "./libs/contracts/src/sprint/sprint.patterns.ts"), exports);
__exportStar(__webpack_require__(/*! ./sprint/entity/sprint.entity */ "./libs/contracts/src/sprint/entity/sprint.entity.ts"), exports);
__exportStar(__webpack_require__(/*! ./epic/create-epic.dto */ "./libs/contracts/src/epic/create-epic.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./epic/update-epic.dto */ "./libs/contracts/src/epic/update-epic.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./epic/epic.patterns */ "./libs/contracts/src/epic/epic.patterns.ts"), exports);
__exportStar(__webpack_require__(/*! ./epic/entity/epic.entity */ "./libs/contracts/src/epic/entity/epic.entity.ts"), exports);
__exportStar(__webpack_require__(/*! ./list/create-list.dto */ "./libs/contracts/src/list/create-list.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./list/update-list.dto */ "./libs/contracts/src/list/update-list.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./list/update-list-order.dto */ "./libs/contracts/src/list/update-list-order.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./list/list.patterns */ "./libs/contracts/src/list/list.patterns.ts"), exports);
__exportStar(__webpack_require__(/*! ./label/create-label.dto */ "./libs/contracts/src/label/create-label.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./label/update-label.dto */ "./libs/contracts/src/label/update-label.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./label/label.patterns */ "./libs/contracts/src/label/label.patterns.ts"), exports);
__exportStar(__webpack_require__(/*! ./label/entity/label.entity */ "./libs/contracts/src/label/entity/label.entity.ts"), exports);
__exportStar(__webpack_require__(/*! ./user/user.patterns */ "./libs/contracts/src/user/user.patterns.ts"), exports);
__exportStar(__webpack_require__(/*! ./user/dto/create-user.dto */ "./libs/contracts/src/user/dto/create-user.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./user/dto/update-user.dto */ "./libs/contracts/src/user/dto/update-user.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./user/dto/validate-user.dto */ "./libs/contracts/src/user/dto/validate-user.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./user/entity/account.entity */ "./libs/contracts/src/user/entity/account.entity.ts"), exports);
__exportStar(__webpack_require__(/*! ./user/entity/user.entity */ "./libs/contracts/src/user/entity/user.entity.ts"), exports);
__exportStar(__webpack_require__(/*! ./user/dto/find-user.dto */ "./libs/contracts/src/user/dto/find-user.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./user/entity/follow.entity */ "./libs/contracts/src/user/entity/follow.entity.ts"), exports);
__exportStar(__webpack_require__(/*! ./team/team.pattern */ "./libs/contracts/src/team/team.pattern.ts"), exports);
__exportStar(__webpack_require__(/*! ./team/dto/create-team.dto */ "./libs/contracts/src/team/dto/create-team.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./team/dto/update-team.dto */ "./libs/contracts/src/team/dto/update-team.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./team/dto/member.dto */ "./libs/contracts/src/team/dto/member.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./team/dto/add-member.dto */ "./libs/contracts/src/team/dto/add-member.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./team/entity/team.entity */ "./libs/contracts/src/team/entity/team.entity.ts"), exports);
__exportStar(__webpack_require__(/*! ./team/entity/team-member.entity */ "./libs/contracts/src/team/entity/team-member.entity.ts"), exports);
__exportStar(__webpack_require__(/*! ./team/dto/remove-member.dto */ "./libs/contracts/src/team/dto/remove-member.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./team/dto/change-role.dto */ "./libs/contracts/src/team/dto/change-role.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./team/dto/leave-member.dto */ "./libs/contracts/src/team/dto/leave-member.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./team/dto/action-role.dto */ "./libs/contracts/src/team/dto/action-role.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./team/dto/transfer-owner.dto */ "./libs/contracts/src/team/dto/transfer-owner.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./team/dto/send-notification.dto */ "./libs/contracts/src/team/dto/send-notification.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./team/dto/remove-team.dto */ "./libs/contracts/src/team/dto/remove-team.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./video-chat/create-call.dto */ "./libs/contracts/src/video-chat/create-call.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./video-chat/video-chat.patterns */ "./libs/contracts/src/video-chat/video-chat.patterns.ts"), exports);
__exportStar(__webpack_require__(/*! ./events/events.pattern */ "./libs/contracts/src/events/events.pattern.ts"), exports);
__exportStar(__webpack_require__(/*! ./search/search.pattern */ "./libs/contracts/src/search/search.pattern.ts"), exports);
__exportStar(__webpack_require__(/*! ./search/dto/search-message.dto */ "./libs/contracts/src/search/dto/search-message.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./file/file.pattern */ "./libs/contracts/src/file/file.pattern.ts"), exports);
__exportStar(__webpack_require__(/*! ./file/dto/delete-file.dto */ "./libs/contracts/src/file/dto/delete-file.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./file/dto/update-file.dto */ "./libs/contracts/src/file/dto/update-file.dto.ts"), exports);
__exportStar(__webpack_require__(/*! ./file/dto/upload-file.dto */ "./libs/contracts/src/file/dto/upload-file.dto.ts"), exports);


/***/ }),

/***/ "./libs/contracts/src/label/create-label.dto.ts":
/*!******************************************************!*\
  !*** ./libs/contracts/src/label/create-label.dto.ts ***!
  \******************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateLabelDto = void 0;
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
class CreateLabelDto {
    name;
    color = '#EFE9E3';
    projectId;
}
exports.CreateLabelDto = CreateLabelDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Bug' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateLabelDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '#EFE9E3' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsHexColor)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateLabelDto.prototype, "color", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, swagger_1.ApiProperty)({ example: '41349af4-756b-4d72-8b55-6ac4ddbf3d9e' }),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateLabelDto.prototype, "projectId", void 0);


/***/ }),

/***/ "./libs/contracts/src/label/entity/label.entity.ts":
/*!*********************************************************!*\
  !*** ./libs/contracts/src/label/entity/label.entity.ts ***!
  \*********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Label = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
let Label = class Label {
    id;
    name;
    color;
    projectId;
    createdAt;
    updatedAt;
};
exports.Label = Label;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Label.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", String)
], Label.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Label.prototype, "color", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", String)
], Label.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], Label.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], Label.prototype, "updatedAt", void 0);
exports.Label = Label = __decorate([
    (0, typeorm_1.Entity)('labels')
], Label);


/***/ }),

/***/ "./libs/contracts/src/label/label.errors.ts":
/*!**************************************************!*\
  !*** ./libs/contracts/src/label/label.errors.ts ***!
  \**************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LabelErrorCode = void 0;
var LabelErrorCode;
(function (LabelErrorCode) {
    LabelErrorCode["LABEL_NOT_FOUND"] = "LABEL_NOT_FOUND";
    LabelErrorCode["LABEL_ALREADY_EXISTS"] = "LABEL_ALREADY_EXISTS";
    LabelErrorCode["INVALID_LABEL_DATA"] = "INVALID_LABEL_DATA";
    LabelErrorCode["UNAUTHORIZED_LABEL_ACCESS"] = "UNAUTHORIZED_LABEL_ACCESS";
    LabelErrorCode["LABEL_IN_USE"] = "LABEL_IN_USE";
})(LabelErrorCode || (exports.LabelErrorCode = LabelErrorCode = {}));


/***/ }),

/***/ "./libs/contracts/src/label/label.patterns.ts":
/*!****************************************************!*\
  !*** ./libs/contracts/src/label/label.patterns.ts ***!
  \****************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LABEL_PATTERNS = void 0;
exports.LABEL_PATTERNS = {
    CREATE: 'label.create',
    FIND_ALL_BY_PROJECT_ID: 'label.findAllByProjectId',
    UPDATE: 'label.update',
    REMOVE: 'label.remove',
    FIND_ONE_BY_ID: 'label.findOneById',
};


/***/ }),

/***/ "./libs/contracts/src/label/update-label.dto.ts":
/*!******************************************************!*\
  !*** ./libs/contracts/src/label/update-label.dto.ts ***!
  \******************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdateLabelDto = void 0;
const mapped_types_1 = __webpack_require__(/*! @nestjs/mapped-types */ "@nestjs/mapped-types");
const create_label_dto_1 = __webpack_require__(/*! ./create-label.dto */ "./libs/contracts/src/label/create-label.dto.ts");
class UpdateLabelDto extends (0, mapped_types_1.PartialType)((0, mapped_types_1.OmitType)(create_label_dto_1.CreateLabelDto, ['projectId'])) {
}
exports.UpdateLabelDto = UpdateLabelDto;


/***/ }),

/***/ "./libs/contracts/src/list/create-list.dto.ts":
/*!****************************************************!*\
  !*** ./libs/contracts/src/list/create-list.dto.ts ***!
  \****************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateListDto = void 0;
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
const list_category_enum_1 = __webpack_require__(/*! ../enums/list-category.enum */ "./libs/contracts/src/enums/list-category.enum.ts");
class CreateListDto {
    name;
    position;
    projectId;
    category;
    isArchived;
}
exports.CreateListDto = CreateListDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The name of the list',
        example: 'To Do',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateListDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The order of the list in the workflow',
        example: 1.0,
    }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateListDto.prototype, "position", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The ID of the project this list belongs to',
        example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateListDto.prototype, "projectId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The logical category of the list',
        enum: list_category_enum_1.ListCategoryEnum,
        default: list_category_enum_1.ListCategoryEnum.TODO,
        required: false,
    }),
    (0, class_validator_1.IsEnum)(list_category_enum_1.ListCategoryEnum),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_a = typeof list_category_enum_1.ListCategoryEnum !== "undefined" && list_category_enum_1.ListCategoryEnum) === "function" ? _a : Object)
], CreateListDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Whether the list is archived',
        default: false,
        required: false,
    }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateListDto.prototype, "isArchived", void 0);


/***/ }),

/***/ "./libs/contracts/src/list/list.errors.ts":
/*!************************************************!*\
  !*** ./libs/contracts/src/list/list.errors.ts ***!
  \************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ListErrorCode = void 0;
var ListErrorCode;
(function (ListErrorCode) {
    ListErrorCode["LIST_NOT_FOUND"] = "LIST_NOT_FOUND";
    ListErrorCode["LIST_ALREADY_EXISTS"] = "LIST_ALREADY_EXISTS";
    ListErrorCode["INVALID_LIST_DATA"] = "INVALID_LIST_DATA";
    ListErrorCode["UNAUTHORIZED_LIST_ACCESS"] = "UNAUTHORIZED_LIST_ACCESS";
    ListErrorCode["LIST_IN_USE"] = "LIST_IN_USE";
    ListErrorCode["INVALID_LIST_ORDER"] = "INVALID_LIST_ORDER";
})(ListErrorCode || (exports.ListErrorCode = ListErrorCode = {}));


/***/ }),

/***/ "./libs/contracts/src/list/list.patterns.ts":
/*!**************************************************!*\
  !*** ./libs/contracts/src/list/list.patterns.ts ***!
  \**************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LIST_PATTERNS = void 0;
exports.LIST_PATTERNS = {
    CREATE: 'list.create',
    CREATE_DEFAULT: 'list.create.default',
    FIND_ALL_BY_PROJECT_ID: 'list.findAllByProjectId',
    UPDATE_BY_ID: 'list.updateById',
    REMOVE_BY_ID: 'list.removeById',
    UPDATE_ORDER: 'list.updateOrder',
    REMOVE: 'list.remove',
    FIND_ONE_BY_ID: 'list.findOneById',
    FIND_ALL_BY_PROJECT: 'list.findAllByProject',
    UPDATE: 'list.update',
    REMOVE_BY_PROJECT: 'list.removeByProject',
    UPDATE_POSITION: 'list.updatePosition',
};


/***/ }),

/***/ "./libs/contracts/src/list/update-list-order.dto.ts":
/*!**********************************************************!*\
  !*** ./libs/contracts/src/list/update-list-order.dto.ts ***!
  \**********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdateListOrderDto = exports.ListOrderEntry = void 0;
const class_transformer_1 = __webpack_require__(/*! class-transformer */ "class-transformer");
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
class ListOrderEntry {
    id;
    order;
}
exports.ListOrderEntry = ListOrderEntry;
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ListOrderEntry.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], ListOrderEntry.prototype, "order", void 0);
class UpdateListOrderDto {
    lists;
}
exports.UpdateListOrderDto = UpdateListOrderDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ListOrderEntry),
    __metadata("design:type", Array)
], UpdateListOrderDto.prototype, "lists", void 0);


/***/ }),

/***/ "./libs/contracts/src/list/update-list.dto.ts":
/*!****************************************************!*\
  !*** ./libs/contracts/src/list/update-list.dto.ts ***!
  \****************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdateListDto = void 0;
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const create_list_dto_1 = __webpack_require__(/*! ./create-list.dto */ "./libs/contracts/src/list/create-list.dto.ts");
class UpdateListDto extends (0, swagger_1.PartialType)(create_list_dto_1.CreateListDto) {
}
exports.UpdateListDto = UpdateListDto;


/***/ }),

/***/ "./libs/contracts/src/notification/dto/notification-event.dto.ts":
/*!***********************************************************************!*\
  !*** ./libs/contracts/src/notification/dto/notification-event.dto.ts ***!
  \***********************************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NotificationEventDto = void 0;
class NotificationEventDto {
    title;
    message;
    type;
    userId;
}
exports.NotificationEventDto = NotificationEventDto;


/***/ }),

/***/ "./libs/contracts/src/notification/dto/notification-update.dto.ts":
/*!************************************************************************!*\
  !*** ./libs/contracts/src/notification/dto/notification-update.dto.ts ***!
  \************************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NotificationUpdateDto = void 0;
const mapped_types_1 = __webpack_require__(/*! @nestjs/mapped-types */ "@nestjs/mapped-types");
const notification_event_dto_1 = __webpack_require__(/*! ./notification-event.dto */ "./libs/contracts/src/notification/dto/notification-event.dto.ts");
class NotificationUpdateDto extends (0, mapped_types_1.PartialType)(notification_event_dto_1.NotificationEventDto) {
    id;
}
exports.NotificationUpdateDto = NotificationUpdateDto;


/***/ }),

/***/ "./libs/contracts/src/notification/notification.pattern.ts":
/*!*****************************************************************!*\
  !*** ./libs/contracts/src/notification/notification.pattern.ts ***!
  \*****************************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NOTIFICATION_PATTERN = void 0;
exports.NOTIFICATION_PATTERN = {
    SEND: 'notification.send',
    CREATE: 'notification.create',
    FIND: 'notification.find',
    UPDATE: 'notification.update',
    DELETE: 'notification.delete',
    MARK_AS_READ: 'notification.markAsRead',
    MARK_AS_UNREAD: 'notification.markAsUnread',
    MARK_ALL_AS_READ: 'notification.markAllAsRead',
    MARK_ALL_AS_UNREAD: 'notification.markAllAsUnread',
    PROCESS_DOCUMENT: 'notification.processDocument',
    TASK_ASSIGNED: 'notification.taskAssigned',
    TASK_UNASSIGNED: 'notification.taskUnassigned',
    TASK_UPDATED: 'notification.taskUpdated',
    TASK_DELETED: 'notification.taskDeleted',
    EPIC_ASSIGNED: 'notification.epicAssigned',
    EPIC_UNASSIGNED: 'notification.epicUnassigned',
    EPIC_UPDATED: 'notification.epicUpdated',
    EPIC_DELETED: 'notification.epicDeleted',
    STATUS_UPDATED: 'notification.statusUpdated',
    LABEL_UPDATED: 'notification.labelUpdated',
    LABEL_DELETED: 'notification.labelDeleted',
    LABEL_CREATED: 'notification.labelCreated',
    PROJECT_INVITATION: 'notification.projectInvitation',
    PROJECT_UPDATED: 'notification.projectUpdated',
    PROJECT_DELETED: 'notification.projectDeleted',
    PROJECT_CREATED: 'notification.projectCreated',
    PROJECT_ASSIGNED: 'notification.projectAssigned',
    PROJECT_UNASSIGNED: 'notification.projectUnassigned',
};


/***/ }),

/***/ "./libs/contracts/src/pagination.dto.ts":
/*!**********************************************!*\
  !*** ./libs/contracts/src/pagination.dto.ts ***!
  \**********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ResponsePaginationDto = exports.RequestPaginationDto = void 0;
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const class_transformer_1 = __webpack_require__(/*! class-transformer */ "class-transformer");
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
class RequestPaginationDto {
    query;
    page = 1;
    limit = 1;
}
exports.RequestPaginationDto = RequestPaginationDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Search query',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RequestPaginationDto.prototype, "query", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Page number',
        required: false,
        default: 1,
    }),
    (0, swagger_1.ApiProperty)({
        description: 'Page number',
        required: false,
        default: 1,
    }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], RequestPaginationDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Number of items per page',
        required: false,
        default: 20,
        maximum: 100,
    }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], RequestPaginationDto.prototype, "limit", void 0);
class ResponsePaginationDto {
    data;
    total;
    page;
    totalPages;
}
exports.ResponsePaginationDto = ResponsePaginationDto;


/***/ }),

/***/ "./libs/contracts/src/project/create-project.dto.ts":
/*!**********************************************************!*\
  !*** ./libs/contracts/src/project/create-project.dto.ts ***!
  \**********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateProjectDto = void 0;
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
const project_visibility_enum_1 = __webpack_require__(/*! ../enums/project-visibility.enum */ "./libs/contracts/src/enums/project-visibility.enum.ts");
class CreateProjectDto {
    name;
    description;
    icon;
    visibility;
    teamId;
    backgroundImageUrl;
    isArchived;
    ownerId;
}
exports.CreateProjectDto = CreateProjectDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Project Alpha' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(3, 100),
    __metadata("design:type", String)
], CreateProjectDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'This is a sample project for demonstration purposes.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Length)(0, 500),
    __metadata("design:type", String)
], CreateProjectDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '🚀' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateProjectDto.prototype, "icon", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: project_visibility_enum_1.ProjectVisibility, example: project_visibility_enum_1.ProjectVisibility.PRIVATE }),
    (0, class_validator_1.IsEnum)(project_visibility_enum_1.ProjectVisibility),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_a = typeof project_visibility_enum_1.ProjectVisibility !== "undefined" && project_visibility_enum_1.ProjectVisibility) === "function" ? _a : Object)
], CreateProjectDto.prototype, "visibility", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'b1a2c3d4-e5f6-7890-abcd-1234567890ef' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateProjectDto.prototype, "teamId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://example.com/background.jpg' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateProjectDto.prototype, "backgroundImageUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateProjectDto.prototype, "isArchived", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'd4c3b2a1-6f5e-0987-dcba-0987654321fe' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateProjectDto.prototype, "ownerId", void 0);


/***/ }),

/***/ "./libs/contracts/src/project/entity/project.entity.ts":
/*!*************************************************************!*\
  !*** ./libs/contracts/src/project/entity/project.entity.ts ***!
  \*************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Project = void 0;
const project_visibility_enum_1 = __webpack_require__(/*! @app/contracts/enums/project-visibility.enum */ "./libs/contracts/src/enums/project-visibility.enum.ts");
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
let Project = class Project {
    id;
    name;
    description;
    icon;
    visibility;
    teamId;
    backgroundImageUrl;
    isArchived;
    createdAt;
    updatedAt;
};
exports.Project = Project;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Project.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Project.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Project.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Project.prototype, "icon", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: project_visibility_enum_1.ProjectVisibility,
        default: project_visibility_enum_1.ProjectVisibility.PRIVATE,
    }),
    __metadata("design:type", typeof (_a = typeof project_visibility_enum_1.ProjectVisibility !== "undefined" && project_visibility_enum_1.ProjectVisibility) === "function" ? _a : Object)
], Project.prototype, "visibility", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'team_id' }),
    __metadata("design:type", String)
], Project.prototype, "teamId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'background_image_url', length: 1024, nullable: true }),
    __metadata("design:type", String)
], Project.prototype, "backgroundImageUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_archived', default: false }),
    __metadata("design:type", Boolean)
], Project.prototype, "isArchived", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], Project.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], Project.prototype, "updatedAt", void 0);
exports.Project = Project = __decorate([
    (0, typeorm_1.Entity)('projects')
], Project);


/***/ }),

/***/ "./libs/contracts/src/project/project.patterns.ts":
/*!********************************************************!*\
  !*** ./libs/contracts/src/project/project.patterns.ts ***!
  \********************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PROJECT_PATTERNS = void 0;
exports.PROJECT_PATTERNS = {
    CREATE: 'project.create',
    FIND_ALL: 'project.findAll',
    GET_BY_ID: 'project.getById',
    UPDATE: 'project.update',
    REMOVE: 'project.remove',
    FIND_ALL_BY_TEAM_ID: 'project.findAllByTeamId',
};


/***/ }),

/***/ "./libs/contracts/src/project/update-project.dto.ts":
/*!**********************************************************!*\
  !*** ./libs/contracts/src/project/update-project.dto.ts ***!
  \**********************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdateProjectDto = void 0;
const mapped_types_1 = __webpack_require__(/*! @nestjs/mapped-types */ "@nestjs/mapped-types");
const create_project_dto_1 = __webpack_require__(/*! ./create-project.dto */ "./libs/contracts/src/project/create-project.dto.ts");
class UpdateProjectDto extends (0, mapped_types_1.PartialType)(create_project_dto_1.CreateProjectDto) {
}
exports.UpdateProjectDto = UpdateProjectDto;


/***/ }),

/***/ "./libs/contracts/src/redis/redis.pattern.ts":
/*!***************************************************!*\
  !*** ./libs/contracts/src/redis/redis.pattern.ts ***!
  \***************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.REDIS_PATTERN = void 0;
exports.REDIS_PATTERN = {
    STORE_REFRESH_TOKEN: 'redis.storeRefreshToken',
    STORE_GOOGLE_TOKEN: 'redis.storeGoogleToken',
    DELETE_REFRESH_TOKEN: 'redis.deleteRefreshToken',
    CLEAR_REFRESH_TOKENS: 'redis.clearRefreshTokens',
    GET_STORED_REFRESH_TOKEN: 'redis.getStoredRefreshToken',
    GET_GOOGLE_TOKEN: 'redis.getGoogleToken',
    SET_LOCK_KEY: 'redis.setLockKey',
    NOTIFICATION: 'redis.notification',
    GET_USER_INFO: 'redis.getUserInfo',
    GET_USER_ROLE: 'redis.getUserRole',
    GET_MANY_USERS_INFO: 'redis.getManyUserInfo',
    SET_MANY_USERS_INFO: 'redis.setManyUserInfo',
    GET_TEAM_MEMBERS: 'redis.getTeamMember',
    GET_TEAM_MEMBERS_WITH_PROFILES: 'redis.getTeamMembersWithProfiles',
    SET_TEAM_MEMBERS: 'redis.setTeamMember'
};


/***/ }),

/***/ "./libs/contracts/src/redis/store-refreshtoken.dto.ts":
/*!************************************************************!*\
  !*** ./libs/contracts/src/redis/store-refreshtoken.dto.ts ***!
  \************************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StoredRefreshTokenDto = void 0;
class StoredRefreshTokenDto {
    token;
    createdAt;
}
exports.StoredRefreshTokenDto = StoredRefreshTokenDto;


/***/ }),

/***/ "./libs/contracts/src/search/dto/search-message.dto.ts":
/*!*************************************************************!*\
  !*** ./libs/contracts/src/search/dto/search-message.dto.ts ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SearchMessageDto = void 0;
class SearchMessageDto {
    userId;
    query;
    discussionId;
    options;
}
exports.SearchMessageDto = SearchMessageDto;


/***/ }),

/***/ "./libs/contracts/src/search/search.pattern.ts":
/*!*****************************************************!*\
  !*** ./libs/contracts/src/search/search.pattern.ts ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SEARCH_PATTERN = void 0;
exports.SEARCH_PATTERN = {
    SEARCH_MESSAGE: "search.message",
    INDEX_DOCUMENT_CHUNK_ROUTING_KEY: "index.document.chunk",
    DELETE_DOCUMENT_INDEX_ROUTING_KEY: "delete.document.index",
    NEW_MESSAGE_CHATBOT: 'search.message.chatbot',
};


/***/ }),

/***/ "./libs/contracts/src/sprint/create-sprint.dto.ts":
/*!********************************************************!*\
  !*** ./libs/contracts/src/sprint/create-sprint.dto.ts ***!
  \********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateSprintDto = void 0;
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const client_1 = __webpack_require__(/*! @prisma/client */ "@prisma/client");
class CreateSprintDto {
    title;
    goal;
    start_date;
    end_date;
    projectId;
    status;
    userId;
}
exports.CreateSprintDto = CreateSprintDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Sprint 3 - Feature Dashboard',
        description: 'Tên sprint',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateSprintDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'Implement the new analytics dashboard',
        description: 'Mục tiêu chính của sprint',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSprintDto.prototype, "goal", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '2025-11-10T00:00:00.000Z',
        description: 'Ngày bắt đầu sprint (ISO format)',
    }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateSprintDto.prototype, "start_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '2025-11-25T23:59:59.000Z',
        description: 'Ngày kết thúc sprint (ISO format)',
    }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateSprintDto.prototype, "end_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '608aa21d-e730-4e02-b731-a20146cc6e38',
        description: 'ID của project chứa sprint này',
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateSprintDto.prototype, "projectId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: client_1.SprintStatus,
        example: 'IN_PROGRESS',
        description: 'Trạng thái của sprint',
    }),
    (0, class_validator_1.IsEnum)(client_1.SprintStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_a = typeof client_1.SprintStatus !== "undefined" && client_1.SprintStatus) === "function" ? _a : Object)
], CreateSprintDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: '19f14dbd-5eaf-4c71-873d-286215ce6ad7',
        description: 'ID của người tạo sprint',
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSprintDto.prototype, "userId", void 0);


/***/ }),

/***/ "./libs/contracts/src/sprint/entity/sprint.entity.ts":
/*!***********************************************************!*\
  !*** ./libs/contracts/src/sprint/entity/sprint.entity.ts ***!
  \***********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Sprint = void 0;
const enums_1 = __webpack_require__(/*! @app/contracts/enums */ "./libs/contracts/src/enums.ts");
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
let Sprint = class Sprint {
    id;
    title;
    goal;
    startDate;
    endDate;
    projectId;
    status;
    createdAt;
    updatedAt;
};
exports.Sprint = Sprint;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Sprint.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Sprint.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Sprint.prototype, "goal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'start_date', type: 'timestamp', nullable: true }),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], Sprint.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'end_date', type: 'timestamp', nullable: true }),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], Sprint.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'project_id' }),
    __metadata("design:type", String)
], Sprint.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_1.SprintStatus,
        default: enums_1.SprintStatus.PLANNED,
    }),
    __metadata("design:type", typeof (_c = typeof enums_1.SprintStatus !== "undefined" && enums_1.SprintStatus) === "function" ? _c : Object)
], Sprint.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
], Sprint.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", typeof (_e = typeof Date !== "undefined" && Date) === "function" ? _e : Object)
], Sprint.prototype, "updatedAt", void 0);
exports.Sprint = Sprint = __decorate([
    (0, typeorm_1.Entity)('sprints')
], Sprint);


/***/ }),

/***/ "./libs/contracts/src/sprint/sprint.patterns.ts":
/*!******************************************************!*\
  !*** ./libs/contracts/src/sprint/sprint.patterns.ts ***!
  \******************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SPRINT_PATTERNS = void 0;
exports.SPRINT_PATTERNS = {
    CREATE: 'sprint.create',
    FIND_ALL_BY_PROJECT_ID: 'sprint.findAllByProjectId',
    UPDATE: 'sprint.update',
    REMOVE: 'sprint.remove',
    GET_ACTIVE_SPRINT: 'sprint.getActiveSprint',
    START_SPRINT: 'sprint.startSprint',
    FIND_ONE_BY_ID: 'sprint.findOneById',
};


/***/ }),

/***/ "./libs/contracts/src/sprint/update-sprint.dto.ts":
/*!********************************************************!*\
  !*** ./libs/contracts/src/sprint/update-sprint.dto.ts ***!
  \********************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdateSprintDto = void 0;
const mapped_types_1 = __webpack_require__(/*! @nestjs/mapped-types */ "@nestjs/mapped-types");
const create_sprint_dto_1 = __webpack_require__(/*! ./create-sprint.dto */ "./libs/contracts/src/sprint/create-sprint.dto.ts");
class UpdateSprintDto extends (0, mapped_types_1.PartialType)(create_sprint_dto_1.CreateSprintDto) {
}
exports.UpdateSprintDto = UpdateSprintDto;


/***/ }),

/***/ "./libs/contracts/src/task/create-task.dto.ts":
/*!****************************************************!*\
  !*** ./libs/contracts/src/task/create-task.dto.ts ***!
  \****************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateTaskDto = void 0;
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const priority_enum_1 = __webpack_require__(/*! ../enums/priority.enum */ "./libs/contracts/src/enums/priority.enum.ts");
class CreateTaskDto {
    title;
    description;
    projectId;
    listId;
    labelIds;
    reporterId;
    priority;
    dueDate;
    startDate;
    epicId;
    sprintId;
    position;
}
exports.CreateTaskDto = CreateTaskDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Title of the task',
        example: 'Implement user authentication',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Detailed description of the task',
        example: 'Implement JWT based authentication with refresh tokens',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID of the project this task belongs to',
        format: 'uuid',
    }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "projectId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID of the list (column) this task is in',
        format: 'uuid',
    }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "listId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'IDs of the label this task is in',
        format: 'uuid',
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateTaskDto.prototype, "labelIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID of the user who reported the task',
        format: 'uuid',
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "reporterId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Priority level of the task',
        enum: priority_enum_1.Priority,
        default: priority_enum_1.Priority.MEDIUM,
    }),
    (0, class_validator_1.IsEnum)(priority_enum_1.Priority),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_a = typeof priority_enum_1.Priority !== "undefined" && priority_enum_1.Priority) === "function" ? _a : Object)
], CreateTaskDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Due date in ISO 8601 format',
    }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], CreateTaskDto.prototype, "dueDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Start date in ISO 8601 format',
    }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], CreateTaskDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID of the parent epic (if any)',
        format: 'uuid',
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "epicId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID of the sprint this task is assigned to',
        format: 'uuid',
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "sprintId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'The position of the task within its column, for ordering.',
        example: 65535.0,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateTaskDto.prototype, "position", void 0);


/***/ }),

/***/ "./libs/contracts/src/task/dto/request-google-task.dto.ts":
/*!****************************************************************!*\
  !*** ./libs/contracts/src/task/dto/request-google-task.dto.ts ***!
  \****************************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RequestGoogleTaskDto = void 0;
class RequestGoogleTaskDto {
    accessToken;
    refreshToken;
}
exports.RequestGoogleTaskDto = RequestGoogleTaskDto;


/***/ }),

/***/ "./libs/contracts/src/task/entity/task-label.entity.ts":
/*!*************************************************************!*\
  !*** ./libs/contracts/src/task/entity/task-label.entity.ts ***!
  \*************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TaskLabel = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const task_entity_1 = __webpack_require__(/*! ./task.entity */ "./libs/contracts/src/task/entity/task.entity.ts");
let TaskLabel = class TaskLabel {
    id;
    name;
    color;
    taskId;
    labelId;
    task;
};
exports.TaskLabel = TaskLabel;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TaskLabel.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TaskLabel.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TaskLabel.prototype, "color", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], TaskLabel.prototype, "taskId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], TaskLabel.prototype, "labelId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => task_entity_1.Task, (task) => task.taskLabels, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'taskId' }),
    __metadata("design:type", typeof (_a = typeof task_entity_1.Task !== "undefined" && task_entity_1.Task) === "function" ? _a : Object)
], TaskLabel.prototype, "task", void 0);
exports.TaskLabel = TaskLabel = __decorate([
    (0, typeorm_1.Entity)('task_labels'),
    (0, typeorm_1.Index)(['taskId', 'labelId'], { unique: true })
], TaskLabel);


/***/ }),

/***/ "./libs/contracts/src/task/entity/task.entity.ts":
/*!*******************************************************!*\
  !*** ./libs/contracts/src/task/entity/task.entity.ts ***!
  \*******************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Task = void 0;
const priority_enum_1 = __webpack_require__(/*! @app/contracts/enums/priority.enum */ "./libs/contracts/src/enums/priority.enum.ts");
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const task_label_entity_1 = __webpack_require__(/*! ./task-label.entity */ "./libs/contracts/src/task/entity/task-label.entity.ts");
let Task = class Task {
    id;
    title;
    description;
    projectId;
    listId;
    reporterId;
    priority;
    dueDate;
    startDate;
    epicId;
    sprintId;
    parentId;
    position;
    createdAt;
    updatedAt;
    taskLabels;
};
exports.Task = Task;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Task.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: false }),
    __metadata("design:type", String)
], Task.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Task.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'projectId', nullable: false }),
    __metadata("design:type", String)
], Task.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'listId', nullable: false }),
    __metadata("design:type", String)
], Task.prototype, "listId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'reporterId', nullable: true }),
    __metadata("design:type", Object)
], Task.prototype, "reporterId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: priority_enum_1.Priority,
        default: priority_enum_1.Priority.MEDIUM,
    }),
    __metadata("design:type", typeof (_a = typeof priority_enum_1.Priority !== "undefined" && priority_enum_1.Priority) === "function" ? _a : Object)
], Task.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'due_date', nullable: true }),
    __metadata("design:type", Object)
], Task.prototype, "dueDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'start_date', nullable: true }),
    __metadata("design:type", Object)
], Task.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'epicId', nullable: true }),
    __metadata("design:type", Object)
], Task.prototype, "epicId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'sprintId', nullable: true }),
    __metadata("design:type", Object)
], Task.prototype, "sprintId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'parentId', nullable: true }),
    __metadata("design:type", Object)
], Task.prototype, "parentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'real', default: 65535, nullable: false }),
    __metadata("design:type", Number)
], Task.prototype, "position", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'createdAt' }),
    __metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
], Task.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updatedAt' }),
    __metadata("design:type", typeof (_e = typeof Date !== "undefined" && Date) === "function" ? _e : Object)
], Task.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => task_label_entity_1.TaskLabel, (taskLabel) => taskLabel.task, {
        cascade: true
    }),
    __metadata("design:type", Array)
], Task.prototype, "taskLabels", void 0);
exports.Task = Task = __decorate([
    (0, typeorm_1.Entity)('tasks')
], Task);


/***/ }),

/***/ "./libs/contracts/src/task/task.errors.ts":
/*!************************************************!*\
  !*** ./libs/contracts/src/task/task.errors.ts ***!
  \************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TASK_ERRORS = exports.TaskErrorCode = void 0;
var TaskErrorCode;
(function (TaskErrorCode) {
    TaskErrorCode["TASK_NOT_FOUND"] = "TASK_NOT_FOUND";
})(TaskErrorCode || (exports.TaskErrorCode = TaskErrorCode = {}));
exports.TASK_ERRORS = {
    NOT_FOUND: (id) => ({
        code: TaskErrorCode.TASK_NOT_FOUND,
        message: `Task${id !== undefined ? ` with id ${id}` : ''} not found`,
    }),
};


/***/ }),

/***/ "./libs/contracts/src/task/task.patterns.ts":
/*!**************************************************!*\
  !*** ./libs/contracts/src/task/task.patterns.ts ***!
  \**************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TASK_PATTERNS = void 0;
exports.TASK_PATTERNS = {
    FIND_ALL: 'task.findAll',
    FIND_ONE: 'task.findOne',
    FIND_ONE_BY_ID: 'task.findOneById',
    FIND_ALL_BY_PROJECT_ID: 'task.findAllByProjectId',
    FIND_BY_USER_ID: 'tasks.findByUserId',
    PROCESS_NLP: 'process_task_intent',
    CREATE: 'task.create',
    UPDATE: 'task.update',
    REMOVE: 'task.remove',
    FIND_GOOGLE_EVENTS: 'task.findGoogleEvents',
    ADD_FILES: 'task.addFiles',
    MOVE_INCOMPLETE_TASKS_TO_BACKLOG: 'task.moveIncompleteToBacklog',
    UNASSIGN_TASKS_FROM_SPRINT: 'task.unassignFromSprint',
};


/***/ }),

/***/ "./libs/contracts/src/task/update-task.dto.ts":
/*!****************************************************!*\
  !*** ./libs/contracts/src/task/update-task.dto.ts ***!
  \****************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdateTaskDto = void 0;
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const create_task_dto_1 = __webpack_require__(/*! ./create-task.dto */ "./libs/contracts/src/task/create-task.dto.ts");
class UpdateTaskDto extends (0, swagger_1.PartialType)(create_task_dto_1.CreateTaskDto) {
}
exports.UpdateTaskDto = UpdateTaskDto;


/***/ }),

/***/ "./libs/contracts/src/team/dto/action-role.dto.ts":
/*!********************************************************!*\
  !*** ./libs/contracts/src/team/dto/action-role.dto.ts ***!
  \********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ActionRole = void 0;
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
const contracts_1 = __webpack_require__(/*! @app/contracts */ "./libs/contracts/src/index.ts");
class ActionRole {
    requesterId;
    requesterName;
    teamId;
    teamName;
    targetId;
    targetName;
    newRole;
}
exports.ActionRole = ActionRole;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ActionRole.prototype, "requesterId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ActionRole.prototype, "requesterName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ActionRole.prototype, "teamId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ActionRole.prototype, "teamName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ActionRole.prototype, "targetId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ActionRole.prototype, "targetName", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(contracts_1.MemberRole),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_a = typeof contracts_1.MemberRole !== "undefined" && contracts_1.MemberRole) === "function" ? _a : Object)
], ActionRole.prototype, "newRole", void 0);


/***/ }),

/***/ "./libs/contracts/src/team/dto/add-member.dto.ts":
/*!*******************************************************!*\
  !*** ./libs/contracts/src/team/dto/add-member.dto.ts ***!
  \*******************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AddMember = void 0;
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
class AddMember {
    requesterId;
    teamId;
    memberIds;
}
exports.AddMember = AddMember;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AddMember.prototype, "requesterId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AddMember.prototype, "teamId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1, { message: 'At least one memberId must be provided.' }),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], AddMember.prototype, "memberIds", void 0);


/***/ }),

/***/ "./libs/contracts/src/team/dto/change-role.dto.ts":
/*!********************************************************!*\
  !*** ./libs/contracts/src/team/dto/change-role.dto.ts ***!
  \********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ChangeRoleMember = void 0;
const contracts_1 = __webpack_require__(/*! @app/contracts */ "./libs/contracts/src/index.ts");
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
class ChangeRoleMember {
    requesterId;
    requesterName;
    teamId;
    teamName;
    targetId;
    targetName;
    newRole;
}
exports.ChangeRoleMember = ChangeRoleMember;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChangeRoleMember.prototype, "requesterId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ChangeRoleMember.prototype, "requesterName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ChangeRoleMember.prototype, "teamId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ChangeRoleMember.prototype, "teamName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChangeRoleMember.prototype, "targetId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ChangeRoleMember.prototype, "targetName", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(contracts_1.MemberRole),
    __metadata("design:type", typeof (_a = typeof contracts_1.MemberRole !== "undefined" && contracts_1.MemberRole) === "function" ? _a : Object)
], ChangeRoleMember.prototype, "newRole", void 0);


/***/ }),

/***/ "./libs/contracts/src/team/dto/create-team.dto.ts":
/*!********************************************************!*\
  !*** ./libs/contracts/src/team/dto/create-team.dto.ts ***!
  \********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateTeamDto = void 0;
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
class CreateTeamDto {
    ownerId;
    name;
    avatar;
    memberIds;
}
exports.CreateTeamDto = CreateTeamDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTeamDto.prototype, "ownerId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTeamDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTeamDto.prototype, "avatar", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.ArrayMinSize)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateTeamDto.prototype, "memberIds", void 0);


/***/ }),

/***/ "./libs/contracts/src/team/dto/leave-member.dto.ts":
/*!*********************************************************!*\
  !*** ./libs/contracts/src/team/dto/leave-member.dto.ts ***!
  \*********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LeaveMemberEventPayload = exports.LeaveMember = void 0;
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
class LeaveMember {
    requesterId;
    requesterName;
    teamId;
    teamName;
}
exports.LeaveMember = LeaveMember;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], LeaveMember.prototype, "requesterId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], LeaveMember.prototype, "requesterName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], LeaveMember.prototype, "teamId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], LeaveMember.prototype, "teamName", void 0);
class LeaveMemberEventPayload {
    teamId;
    teamName;
    requester;
    memberIdsToNotify;
}
exports.LeaveMemberEventPayload = LeaveMemberEventPayload;


/***/ }),

/***/ "./libs/contracts/src/team/dto/member.dto.ts":
/*!***************************************************!*\
  !*** ./libs/contracts/src/team/dto/member.dto.ts ***!
  \***************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MemberDto = void 0;
const member_role_enum_1 = __webpack_require__(/*! @app/contracts/enums/member-role.enum */ "./libs/contracts/src/enums/member-role.enum.ts");
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
class MemberDto {
    id;
    name;
    avatar;
    role;
}
exports.MemberDto = MemberDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MemberDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MemberDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MemberDto.prototype, "avatar", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(member_role_enum_1.MemberRole),
    __metadata("design:type", typeof (_a = typeof member_role_enum_1.MemberRole !== "undefined" && member_role_enum_1.MemberRole) === "function" ? _a : Object)
], MemberDto.prototype, "role", void 0);


/***/ }),

/***/ "./libs/contracts/src/team/dto/remove-member.dto.ts":
/*!**********************************************************!*\
  !*** ./libs/contracts/src/team/dto/remove-member.dto.ts ***!
  \**********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RemoveMember = void 0;
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
class RemoveMember {
    requesterId;
    teamId;
    memberIds;
}
exports.RemoveMember = RemoveMember;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RemoveMember.prototype, "requesterId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RemoveMember.prototype, "teamId", void 0);
__decorate([
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1, {
        message: 'At least one memberId must be provided.',
    }),
    __metadata("design:type", Array)
], RemoveMember.prototype, "memberIds", void 0);


/***/ }),

/***/ "./libs/contracts/src/team/dto/remove-team.dto.ts":
/*!********************************************************!*\
  !*** ./libs/contracts/src/team/dto/remove-team.dto.ts ***!
  \********************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RemoveTeam = void 0;
class RemoveTeam {
    userId;
    teamId;
}
exports.RemoveTeam = RemoveTeam;


/***/ }),

/***/ "./libs/contracts/src/team/dto/send-notification.dto.ts":
/*!**************************************************************!*\
  !*** ./libs/contracts/src/team/dto/send-notification.dto.ts ***!
  \**************************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SendTeamNotificationDto = void 0;
class SendTeamNotificationDto {
    members;
    message;
}
exports.SendTeamNotificationDto = SendTeamNotificationDto;


/***/ }),

/***/ "./libs/contracts/src/team/dto/transfer-owner.dto.ts":
/*!***********************************************************!*\
  !*** ./libs/contracts/src/team/dto/transfer-owner.dto.ts ***!
  \***********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TransferOwnership = void 0;
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
class TransferOwnership {
    teamId;
    newOwnerId;
    requesterId;
}
exports.TransferOwnership = TransferOwnership;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransferOwnership.prototype, "teamId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransferOwnership.prototype, "newOwnerId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransferOwnership.prototype, "requesterId", void 0);


/***/ }),

/***/ "./libs/contracts/src/team/dto/update-team.dto.ts":
/*!********************************************************!*\
  !*** ./libs/contracts/src/team/dto/update-team.dto.ts ***!
  \********************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdateTeam = void 0;
const mapped_types_1 = __webpack_require__(/*! @nestjs/mapped-types */ "@nestjs/mapped-types");
const create_team_dto_1 = __webpack_require__(/*! ./create-team.dto */ "./libs/contracts/src/team/dto/create-team.dto.ts");
class UpdateTeam extends (0, mapped_types_1.PartialType)(create_team_dto_1.CreateTeamDto) {
}
exports.UpdateTeam = UpdateTeam;


/***/ }),

/***/ "./libs/contracts/src/team/entity/team-member.entity.ts":
/*!**************************************************************!*\
  !*** ./libs/contracts/src/team/entity/team-member.entity.ts ***!
  \**************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TeamMember = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const team_entity_1 = __webpack_require__(/*! ./team.entity */ "./libs/contracts/src/team/entity/team.entity.ts");
const contracts_1 = __webpack_require__(/*! @app/contracts */ "./libs/contracts/src/index.ts");
let TeamMember = class TeamMember {
    id;
    team;
    userId;
    role;
    isActive;
    joinedAt;
};
exports.TeamMember = TeamMember;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TeamMember.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => team_entity_1.Team, (team) => team.members, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'teamId' }),
    __metadata("design:type", typeof (_a = typeof team_entity_1.Team !== "undefined" && team_entity_1.Team) === "function" ? _a : Object)
], TeamMember.prototype, "team", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TeamMember.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: contracts_1.MemberRole,
        default: contracts_1.MemberRole.MEMBER,
    }),
    __metadata("design:type", typeof (_b = typeof contracts_1.MemberRole !== "undefined" && contracts_1.MemberRole) === "function" ? _b : Object)
], TeamMember.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], TeamMember.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], TeamMember.prototype, "joinedAt", void 0);
exports.TeamMember = TeamMember = __decorate([
    (0, typeorm_1.Entity)()
], TeamMember);


/***/ }),

/***/ "./libs/contracts/src/team/entity/team.entity.ts":
/*!*******************************************************!*\
  !*** ./libs/contracts/src/team/entity/team.entity.ts ***!
  \*******************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Team = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const team_member_entity_1 = __webpack_require__(/*! ./team-member.entity */ "./libs/contracts/src/team/entity/team-member.entity.ts");
const contracts_1 = __webpack_require__(/*! @app/contracts */ "./libs/contracts/src/index.ts");
let Team = class Team {
    id;
    name;
    avatar;
    ownerId;
    members;
    status;
    createdAt;
    updatedAt;
};
exports.Team = Team;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Team.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Team.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Team.prototype, "avatar", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Team.prototype, "ownerId", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => team_member_entity_1.TeamMember, (member) => member.team),
    __metadata("design:type", Array)
], Team.prototype, "members", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: contracts_1.TeamStatus,
        default: contracts_1.TeamStatus.ARCHIVED,
    }),
    __metadata("design:type", typeof (_a = typeof contracts_1.TeamStatus !== "undefined" && contracts_1.TeamStatus) === "function" ? _a : Object)
], Team.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], Team.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], Team.prototype, "updatedAt", void 0);
exports.Team = Team = __decorate([
    (0, typeorm_1.Entity)()
], Team);


/***/ }),

/***/ "./libs/contracts/src/team/team.pattern.ts":
/*!*************************************************!*\
  !*** ./libs/contracts/src/team/team.pattern.ts ***!
  \*************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TEAM_PATTERN = void 0;
exports.TEAM_PATTERN = {
    CREATE: 'team.create',
    CREATE_DEFAULT_TEAM: 'team.createDefaultTeam',
    FIND_ALL: 'team.findAll',
    FIND_BY_ID: 'team.findById',
    FIND_BY_IDS: 'team.findByIds',
    FIND_BY_USER_ID: 'team.findByUserId',
    FIND_BY_OWNER_ID: 'team.findByOwnerId',
    FIND_ROOMS_BY_USER_ID: 'team.findRoomsByUserId',
    FIND_PARTICIPANT_ROLES: 'team.findParticipantRoles',
    FIND_PARTICIPANTS: 'team.findParticipants',
    FIND_PARTICIPANTS_IDS: 'team.findParticipantsIds',
    UPDATE: 'team.update',
    REMOVE: 'team.remove',
    ADD_MEMBER: 'team.addMember',
    REMOVE_MEMBER: 'team.removeMember',
    REMOVE_TEAM: 'team.removeTeam',
    PROMOTE_TO_ADMIN: 'team.promoteToAdmin',
    DEMOTE_FROM_ADMIN: 'team.demoteFromAdmin',
    CHANGE_ROLE: 'team.changeRole',
    LEAVE_TEAM: 'team.leaveTeam',
    TRANSFER_OWNERSHIP: 'team.transferOwnership',
    JOIN_TEAM: 'team.joinTeam',
    KICK_MEMBER: 'team.kickMember',
    SEND_NOTIFICATION: 'team.sendNotification',
    VERIFY_PERMISSION: 'team.verifyPermission',
};


/***/ }),

/***/ "./libs/contracts/src/user/dto/create-user.dto.ts":
/*!********************************************************!*\
  !*** ./libs/contracts/src/user/dto/create-user.dto.ts ***!
  \********************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateUserDto = void 0;
class CreateUserDto {
    name;
    email;
    avatar;
    phone;
}
exports.CreateUserDto = CreateUserDto;


/***/ }),

/***/ "./libs/contracts/src/user/dto/find-user.dto.ts":
/*!******************************************************!*\
  !*** ./libs/contracts/src/user/dto/find-user.dto.ts ***!
  \******************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FindUserDto = void 0;
class FindUserDto {
    key;
    options;
    requesterId;
    teamId;
}
exports.FindUserDto = FindUserDto;


/***/ }),

/***/ "./libs/contracts/src/user/dto/update-user.dto.ts":
/*!********************************************************!*\
  !*** ./libs/contracts/src/user/dto/update-user.dto.ts ***!
  \********************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdateUserDto = void 0;
const mapped_types_1 = __webpack_require__(/*! @nestjs/mapped-types */ "@nestjs/mapped-types");
const create_user_dto_1 = __webpack_require__(/*! ./create-user.dto */ "./libs/contracts/src/user/dto/create-user.dto.ts");
class UpdateUserDto extends (0, mapped_types_1.PartialType)(create_user_dto_1.CreateUserDto) {
}
exports.UpdateUserDto = UpdateUserDto;


/***/ }),

/***/ "./libs/contracts/src/user/dto/validate-user.dto.ts":
/*!**********************************************************!*\
  !*** ./libs/contracts/src/user/dto/validate-user.dto.ts ***!
  \**********************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ValidateUserDto = void 0;
class ValidateUserDto {
    id;
    username;
    name;
    email;
    provider;
    phone;
}
exports.ValidateUserDto = ValidateUserDto;


/***/ }),

/***/ "./libs/contracts/src/user/entity/account.entity.ts":
/*!**********************************************************!*\
  !*** ./libs/contracts/src/user/entity/account.entity.ts ***!
  \**********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Account = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const user_entity_1 = __webpack_require__(/*! ./user.entity */ "./libs/contracts/src/user/entity/user.entity.ts");
const contracts_1 = __webpack_require__(/*! @app/contracts */ "./libs/contracts/src/index.ts");
let Account = class Account {
    id;
    provider;
    providerId;
    email;
    password;
    createdAt;
    updatedAt;
    user;
};
exports.Account = Account;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Account.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: contracts_1.Provider }),
    __metadata("design:type", typeof (_a = typeof contracts_1.Provider !== "undefined" && contracts_1.Provider) === "function" ? _a : Object)
], Account.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Account.prototype, "providerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Account.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Account.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], Account.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], Account.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.accounts, { onDelete: 'CASCADE' }),
    __metadata("design:type", typeof (_d = typeof user_entity_1.User !== "undefined" && user_entity_1.User) === "function" ? _d : Object)
], Account.prototype, "user", void 0);
exports.Account = Account = __decorate([
    (0, typeorm_1.Entity)('accounts'),
    (0, typeorm_1.Index)(['provider', 'providerId'], { unique: true })
], Account);


/***/ }),

/***/ "./libs/contracts/src/user/entity/follow.entity.ts":
/*!*********************************************************!*\
  !*** ./libs/contracts/src/user/entity/follow.entity.ts ***!
  \*********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Follow = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const user_entity_1 = __webpack_require__(/*! ./user.entity */ "./libs/contracts/src/user/entity/user.entity.ts");
let Follow = class Follow {
    followerId;
    followingId;
    follower;
    following;
    createdAt;
};
exports.Follow = Follow;
__decorate([
    (0, typeorm_1.PrimaryColumn)("uuid"),
    __metadata("design:type", String)
], Follow.prototype, "followerId", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)("uuid"),
    __metadata("design:type", String)
], Follow.prototype, "followingId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.following),
    (0, typeorm_1.JoinColumn)({ name: "followerId" }),
    __metadata("design:type", typeof (_a = typeof user_entity_1.User !== "undefined" && user_entity_1.User) === "function" ? _a : Object)
], Follow.prototype, "follower", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.followers),
    (0, typeorm_1.JoinColumn)({ name: "followingId" }),
    __metadata("design:type", typeof (_b = typeof user_entity_1.User !== "undefined" && user_entity_1.User) === "function" ? _b : Object)
], Follow.prototype, "following", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], Follow.prototype, "createdAt", void 0);
exports.Follow = Follow = __decorate([
    (0, typeorm_1.Entity)("follows")
], Follow);


/***/ }),

/***/ "./libs/contracts/src/user/entity/user.entity.ts":
/*!*******************************************************!*\
  !*** ./libs/contracts/src/user/entity/user.entity.ts ***!
  \*******************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.User = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const account_entity_1 = __webpack_require__(/*! ./account.entity */ "./libs/contracts/src/user/entity/account.entity.ts");
const follow_entity_1 = __webpack_require__(/*! ./follow.entity */ "./libs/contracts/src/user/entity/follow.entity.ts");
const enums_1 = __webpack_require__(/*! @app/contracts/enums */ "./libs/contracts/src/enums.ts");
let User = class User {
    id;
    email;
    name;
    avatar;
    phone;
    role;
    isBan;
    isActive;
    isVerified;
    verifiedCode;
    expiredCode;
    resetCode;
    bio;
    lastLogin;
    createdAt;
    updatedAt;
    accounts;
    following;
    followers;
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "avatar", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', unique: true, nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Object)
], User.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: enums_1.Role, default: enums_1.Role.USER }),
    __metadata("design:type", typeof (_a = typeof enums_1.Role !== "undefined" && enums_1.Role) === "function" ? _a : Object)
], User.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "isBan", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], User.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "isVerified", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, select: false }),
    __metadata("design:type", Object)
], User.prototype, "verifiedCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, select: false }),
    __metadata("design:type", Object)
], User.prototype, "expiredCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, select: false }),
    __metadata("design:type", Object)
], User.prototype, "resetCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "bio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], User.prototype, "lastLogin", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ select: false }),
    __metadata("design:type", typeof (_e = typeof Date !== "undefined" && Date) === "function" ? _e : Object)
], User.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => account_entity_1.Account, (account) => account.user),
    __metadata("design:type", Array)
], User.prototype, "accounts", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => follow_entity_1.Follow, (follow) => follow.follower),
    __metadata("design:type", Array)
], User.prototype, "following", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => follow_entity_1.Follow, (follow) => follow.following),
    __metadata("design:type", Array)
], User.prototype, "followers", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('users')
], User);


/***/ }),

/***/ "./libs/contracts/src/user/user.patterns.ts":
/*!**************************************************!*\
  !*** ./libs/contracts/src/user/user.patterns.ts ***!
  \**************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.USER_PATTERNS = void 0;
exports.USER_PATTERNS = {
    CREATE: 'user.create',
    CREATE_LOCAL: 'user.createLocal',
    CREATE_OAUTH: 'user.createOAuth',
    CREATE_ACCOUNT: 'user.createAccount',
    VERIFY_LOCAL: 'user.verifyLocal',
    VERIFY_FORGET_PASSWORD: 'user.verifyForgetPasswordCode',
    RESET_CODE: 'user.resetCode',
    RESET_PASSWORD: 'user.resetPassword',
    FIND_ALL: 'user.findAll',
    FIND_ONE: 'user.findOne',
    FIND_ONE_WITH_PASSWORD: 'user.findOneWithPassword',
    FIND_ONE_GOOGLE_BY_EMAIL: 'user.findOneGoogleByEmail',
    FIND_ONE_BY_EMAIL: 'user.findOneByEmail',
    FIND_ONE_OAUTH: 'user.findOneOAuth',
    FIND_MANY_BY_IDs: 'user.findManyByIds',
    FIND_MANY_BY_NAME: 'user.findManyByName',
    UPDATE: 'user.update',
    UPDATE_PASSWORD: 'user.updatePassword',
    REMOVE: 'user.remove',
    VALIDATE: 'user.validate',
    VERIFY_EMAIL: 'user.verifyEmail',
    SEND_VERIFICATION_EMAIL: 'user.sendVerificationEmail',
    FOLLOW: 'user.follow',
    UNFOLLOW: 'user.unfollow',
    BAN: 'user.ban',
    UNBAN: 'user.unban',
};


/***/ }),

/***/ "./libs/contracts/src/video-chat/create-call.dto.ts":
/*!**********************************************************!*\
  !*** ./libs/contracts/src/video-chat/create-call.dto.ts ***!
  \**********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateCallDto = void 0;
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
class CreateCallDto {
    roomId;
    participantIds;
}
exports.CreateCallDto = CreateCallDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCallDto.prototype, "roomId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsNotEmpty)({ each: true }),
    __metadata("design:type", Array)
], CreateCallDto.prototype, "participantIds", void 0);


/***/ }),

/***/ "./libs/contracts/src/video-chat/video-chat.patterns.ts":
/*!**************************************************************!*\
  !*** ./libs/contracts/src/video-chat/video-chat.patterns.ts ***!
  \**************************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WEBSOCKET_EVENTS = exports.VIDEO_CHAT_PATTERNS = void 0;
exports.VIDEO_CHAT_PATTERNS = {
    CREATE_GROUP_CALL: 'video-chat.create-group-call',
    CREATE_CALL: 'video-chat.createCall',
    GET_CALL_HISTORY: 'video-chat.getCallHistory',
};
exports.WEBSOCKET_EVENTS = {
    GROUP_CALL_INVITATION: 'group-call-invitation',
    JOIN_ROOM: 'join-room',
    NEW_USER_JOINED: 'new-user-joined',
    USER_LEFT: 'user-left',
    WEBRTC_SIGNAL: 'webrtc-signal',
    WEBRTC_ICE_CANDIDATE: 'webrtc-ice-candidate',
};


/***/ }),

/***/ "@golevelup/nestjs-rabbitmq":
/*!*********************************************!*\
  !*** external "@golevelup/nestjs-rabbitmq" ***!
  \*********************************************/
/***/ ((module) => {

module.exports = require("@golevelup/nestjs-rabbitmq");

/***/ }),

/***/ "@nestjs/common":
/*!*********************************!*\
  !*** external "@nestjs/common" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("@nestjs/common");

/***/ }),

/***/ "@nestjs/config":
/*!*********************************!*\
  !*** external "@nestjs/config" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("@nestjs/config");

/***/ }),

/***/ "@nestjs/core":
/*!*******************************!*\
  !*** external "@nestjs/core" ***!
  \*******************************/
/***/ ((module) => {

module.exports = require("@nestjs/core");

/***/ }),

/***/ "@nestjs/mapped-types":
/*!***************************************!*\
  !*** external "@nestjs/mapped-types" ***!
  \***************************************/
/***/ ((module) => {

module.exports = require("@nestjs/mapped-types");

/***/ }),

/***/ "@nestjs/microservices":
/*!****************************************!*\
  !*** external "@nestjs/microservices" ***!
  \****************************************/
/***/ ((module) => {

module.exports = require("@nestjs/microservices");

/***/ }),

/***/ "@nestjs/swagger":
/*!**********************************!*\
  !*** external "@nestjs/swagger" ***!
  \**********************************/
/***/ ((module) => {

module.exports = require("@nestjs/swagger");

/***/ }),

/***/ "@nestjs/websockets":
/*!*************************************!*\
  !*** external "@nestjs/websockets" ***!
  \*************************************/
/***/ ((module) => {

module.exports = require("@nestjs/websockets");

/***/ }),

/***/ "@prisma/client":
/*!*********************************!*\
  !*** external "@prisma/client" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("@prisma/client");

/***/ }),

/***/ "class-transformer":
/*!************************************!*\
  !*** external "class-transformer" ***!
  \************************************/
/***/ ((module) => {

module.exports = require("class-transformer");

/***/ }),

/***/ "class-validator":
/*!**********************************!*\
  !*** external "class-validator" ***!
  \**********************************/
/***/ ((module) => {

module.exports = require("class-validator");

/***/ }),

/***/ "cookie":
/*!*************************!*\
  !*** external "cookie" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("cookie");

/***/ }),

/***/ "ioredis":
/*!**************************!*\
  !*** external "ioredis" ***!
  \**************************/
/***/ ((module) => {

module.exports = require("ioredis");

/***/ }),

/***/ "joi":
/*!**********************!*\
  !*** external "joi" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("joi");

/***/ }),

/***/ "rxjs":
/*!***********************!*\
  !*** external "rxjs" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("rxjs");

/***/ }),

/***/ "socket.io":
/*!****************************!*\
  !*** external "socket.io" ***!
  \****************************/
/***/ ((module) => {

module.exports = require("socket.io");

/***/ }),

/***/ "typeorm":
/*!**************************!*\
  !*** external "typeorm" ***!
  \**************************/
/***/ ((module) => {

module.exports = require("typeorm");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;
/*!********************************!*\
  !*** ./apps/redis/src/main.ts ***!
  \********************************/

Object.defineProperty(exports, "__esModule", ({ value: true }));
const core_1 = __webpack_require__(/*! @nestjs/core */ "@nestjs/core");
const redis_module_1 = __webpack_require__(/*! ./redis/redis.module */ "./apps/redis/src/redis/redis.module.ts");
async function bootstrap() {
    const app = await core_1.NestFactory.create(redis_module_1.RedisModule);
    await app.init();
}
bootstrap();

})();

/******/ })()
;