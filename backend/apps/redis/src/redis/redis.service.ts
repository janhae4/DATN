import { AddMemberEventPayload, ChangeRoleMember, CreateTeamEventPayload, LeaveMemberEventPayload, MemberRole, RemoveMemberEventPayload, RemoveTeamEventPayload, StoredRefreshTokenDto, Team, TEAM_EXCHANGE, TEAM_PATTERN, TransferOwnershipEventPayload, User } from '@app/contracts';
import { BadRequestException } from '@app/contracts/error';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Redis from 'ioredis';
ConfigModule.forRoot();
const TTL_24_HOURS = 86400;

@Injectable()
export class RedisService {
  private redis: Redis;
  private readonly logger = new Logger(RedisService.name);
  constructor(
    private readonly amqp: AmqpConnection
  ) {
    this.redis = new Redis({
      host: process.env.REDIS_CLIENT_HOST || 'localhost',
      port: Number(process.env.REDIS_CLIENT_PORT) || 6379,
    });
  }

  private getTail(str: string) {
    return str ? `...${str.substring(str.length - 8)}` : 'NULL';
  }
  async storeRefreshToken(
  userId: string,
  sessionId: string,
  hashedRefresh: string,
  exp: number,
) {
  const activeKey = `refresh:${userId}:${sessionId}`;
  const usedKey = `used_refresh:${userId}:${sessionId}`;
  const oldTokenHash = await this.redis.hget(activeKey, 'token');
  const pipe = this.redis.pipeline();

  if (oldTokenHash) {
    pipe.lpush(usedKey, oldTokenHash);
    pipe.expire(usedKey, 300);
  }
  pipe.hmset(activeKey, {
    token: hashedRefresh,
    createdAt: String(Date.now()),
  });
  pipe.expire(activeKey, exp);
  await pipe.exec();
}


  async isTokenUsed(userId: string, tokenHash: string) {
  console.log(userId, tokenHash)
  const key = `used_refresh:${userId}:${tokenHash}`;
  return await this.redis.get(key);
}

  async getStoredRefreshToken(userId: string, sessionId: string) {
  const key = `refresh:${userId}:${sessionId}`;
  const data = await this.redis.hgetall(key);
  this.logger.log('Retrieved refresh token for user:', userId);
  return Object.keys(data).length > 0
    ? (data as unknown as StoredRefreshTokenDto)
    : false;
}

  async deleteRefreshToken(userId: string, sessionId: string) {
  const key = `refresh:${userId}:${sessionId}`;
  await this.redis.del(key);
  this.logger.log('Deleted refresh token for user:', userId);
}

  async clearRefreshTokens(userId: string) {
  const pattern = `refresh:${userId}:*`;
  const keys = await this.scanKeys(pattern);
  if (keys.length) await this.redis.del(keys);
  this.logger.log('Cleared refresh tokens for user:', userId);
}

  async setLockKey(userId: string, sessionId: string) {
  const key = `lock:${userId}:${sessionId}`;
  console.log("Lock Key: ", await this.redis.get(key));
  this.logger.log('Setting lock key for user:', userId);
  return await this.redis.set(key, '1', 'EX', 10, 'NX');
}

  async deleteLockKey(userId: string, sessionId: string) {
  const key = `lock:${userId}:${sessionId}`;
  return await this.redis.del(key);
}

  private async scanKeys(pattern: string) {
  const found: string[] = [];
  let cursor = '0';
  do {
    const [nextCursor, keys] = await this.redis.scan(
      cursor,
      'MATCH',
      pattern,
      'COUNT',
      1000,
    );
    if (keys.length) found.push(...keys);
    cursor = nextCursor;
  } while (cursor !== '0');
  return found;
}


  async storeGoogleToken(
  userId: string,
  accessToken: string,
  refreshToken: string,
) {
  const accessKey = `google:${userId}:access`;
  const refreshKey = `google:${userId}:refresh`;

  await this.redis.set(accessKey, accessToken, 'EX', 3600);

  if (refreshToken) {
    await this.redis.set(refreshKey, refreshToken);
    this.logger.log('Stored refresh token for user:', userId);
  }
  this.logger.log('Stored access token for user:', userId);
}

  async getGoogleToken(userId: string) {
  const accessKey = `google:${userId}:access`;
  const refreshKey = `google:${userId}:refresh`;
  const [accessToken, refreshToken] = await Promise.all([
    this.redis.get(accessKey),
    this.redis.get(refreshKey),
  ]);

  console.log("accessToken and Refresh Token:", accessToken, refreshToken)

  if (!refreshToken) {
    this.logger.warn('No valid Google tokens found for user:', userId);
    throw new BadRequestException('No Google account linked');
  }

  this.logger.log('Retrieved Google tokens for user:', userId);
  return { accessToken, refreshToken };
}

  async handleUserLogin(user: User, memberRoles ?: { teamId: string; role: string }[]) {
  if (!user || !user.id) return;

  this.logger.log(`Received login event, caching for user: ${user.id}`);

  try {
    const pipe = this.redis.pipeline();

    const profileKey = `user:profile:${user.id}`;
    const profileData = { id: user.id, name: user.name, avatar: user.avatar };
    pipe.set(
      profileKey,
      JSON.stringify(profileData),
      'EX',
      TTL_24_HOURS,
    );

    const rolesKey = `user:roles:${user.id}`;
    pipe.del(rolesKey);

    if (memberRoles && memberRoles.length > 0) {
      const rolesMap = memberRoles.reduce((acc, item) => {
        acc[item.teamId] = item.role;
        return acc;
      }, {});

      console.log(rolesMap)

      pipe.hset(rolesKey, rolesMap);
    }

    pipe.expire(rolesKey, TTL_24_HOURS);

    await pipe.exec();

    this.logger.log(`Successfully executed cache pipeline for user ${user.id}`);

  } catch (redisError) {
    this.logger.error(`Failed to execute cache pipeline for user ${user.id}`, redisError);
  }
}

  async cacheUserProfile(user: User) {
  const key = `user:profile:${user.id}`;

  const profileData = {
    id: user.id,
    name: user.name,
    avatar: user.avatar,
  };

  this.logger.log(`Caching profile for user: ${user.id}`);

  return await this.redis.set(
    key,
    JSON.stringify(profileData),
    'EX',
    TTL_24_HOURS
  );
}

  async getUserInfo(userIds: string[]) {
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

  async getUserRole(userId: string, teamId: string) {
  const key = `user:roles:${userId}`;
  const data = await this.redis.hget(key, teamId);
  this.logger.log('Retrieved user role for user:', userId);
  return data;
}

  async getManyUserInfo(userIds: string[]) {
  if (!Array.isArray(userIds)) {
    userIds = typeof userIds === 'string' ? [userIds] : [];
  }
  const keys = userIds.map((id) => `user:profile:${id}`);
  const results = await this.redis.mget(keys);
  const profiles = results
    .filter(profile => profile != null)
    .map(profile => JSON.parse(profile))
  return profiles
}

  async setManyUserInfo(users: User[]) {
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
  } catch (error) {
    this.logger.error('Failed to cache user profiles in pipeline', error);
  }
}

  async userUpdated(user: User) {
  if (!user || !user.id) return;

  this.logger.log(`Updating cached profile for user: ${user.id}`);
  const key = `user:profile:${user.id}`;
  const profileData = {
    id: user.id,
    name: user.name,
    avatar: user.avatar,
  };

  await this.redis.set(
    key,
    JSON.stringify(profileData),
    'EX',
    TTL_24_HOURS,
  );
}

  async createTeam(payload: CreateTeamEventPayload) {
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
    pipe.set(
      profileKey,
      JSON.stringify(profileData),
      'EX',
      TTL_24_HOURS,
    );

    const rolesKey = `user:roles:${member.id}`;
    pipe.hset(rolesKey, teamSnapshot.id, owner.id === member.id ? MemberRole.OWNER : MemberRole.MEMBER);
    pipe.expire(rolesKey, TTL_24_HOURS);

    pipe.sadd(teamKey, member.id);
  }

  pipe.expire(teamKey, TTL_24_HOURS);

  try {
    await pipe.exec();
    this.logger.log(`Cached team ${teamSnapshot.id} and its members successfully.`);
  } catch (error) {
    this.logger.error(`Failed to cache team ${teamSnapshot.id} and its members`, error);
  }

}

  async addMember(payload: AddMemberEventPayload) {
  const { teamId, members } = payload;
  if (!teamId || !members || members.length === 0) return;

  this.logger.log(`Caching ${members.length} new members for team: ${teamId}`);
  const pipe = this.redis.pipeline();

  for (const member of members) {
    const profileKey = `user:profile:${member.id}`;
    const profileData = {
      id: member.id,
      name: member.name,
      avatar: member.avatar,
    };
    pipe.set(
      profileKey,
      JSON.stringify(profileData),
      'EX',
      TTL_24_HOURS,
    );

    const rolesKey = `user:roles:${member.id}`;
    pipe.hset(rolesKey, teamId, MemberRole.MEMBER);
    pipe.expire(rolesKey, TTL_24_HOURS);

    const teamKey = `team:members:${teamId}`;
    pipe.sadd(teamKey, member.id);
    pipe.expire(teamKey, TTL_24_HOURS);
  }

  await pipe.exec();
}

  async removeMember(payload: RemoveMemberEventPayload) {
  const { teamId, members } = payload;
  if (!teamId || !members || members.length === 0) return;

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

  async changeRoleTeam(payload: ChangeRoleMember) {
  const { teamId, targetId, newRole } = payload;
  if (!teamId || !targetId || !newRole) return;

  this.logger.log(`Changing role for ${targetId} in team ${teamId} to ${newRole}`);
  const rolesKey = `user:roles:${targetId}`;

  const pipe = this.redis.pipeline();
  pipe.hset(rolesKey, teamId, newRole);
  pipe.expire(rolesKey, TTL_24_HOURS);
  await pipe.exec()
}

  async leaveTeam(payload: LeaveMemberEventPayload) {
  const { teamId, requester } = payload;
  if (!teamId || !requester || !requester.id) return;

  const pipe = this.redis.pipeline();

  const rolesKey = `user:roles:${requester.id}`;
  pipe.hdel(rolesKey, teamId);

  const teamMembersKey = `team:members:${teamId}`;
  pipe.srem(teamMembersKey, requester.id);

  await pipe.exec();
}

  async removeTeam(payload: RemoveTeamEventPayload) {
  const { teamId, memberIdsToNotify } = payload;
  if (!teamId) return;

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

  async ownershipTransferred(payload: TransferOwnershipEventPayload) {
  const { newOwnerId, teamId, requesterId } = payload

  const pipe = this.redis.pipeline();

  const oldOwnerRoleKey = `user:roles:${requesterId}`;
  const newOwnerRoleKey = `user:roles:${newOwnerId}`;
  pipe.hset(oldOwnerRoleKey, teamId, MemberRole.MEMBER);
  pipe.expire(oldOwnerRoleKey, TTL_24_HOURS);
  pipe.hset(newOwnerRoleKey, teamId, MemberRole.OWNER);
  pipe.expire(newOwnerRoleKey, TTL_24_HOURS);
  await pipe.exec()
}

  async getTeamMembers(teamId: string) {
  const teamMembersKey = `team:members:${teamId}`;
  return await this.redis.smembers(teamMembersKey);
}

  async getTeamMembersWithProfiles(teamId: string) {
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
    .map(profileString => JSON.parse(profileString!));

  return profiles;
}

  async setTeamMembers(teamId: string, members: string[]) {
  const teamMembersKey = `team:members:${teamId}`;
  return await this.redis.sadd(teamMembersKey, members);
}

  async pushToMeetingBuffer(roomId: string, userId: string, userName: string, content: string, timestamp: Date) {
  const redisKey = `meeting:${roomId}:buffer`;
  const dataString = JSON.stringify({ userId, userName, content, timestamp });
  await this.redis.rpush(redisKey, dataString);
  this.logger.debug(await this.redis.lrange(redisKey, 0, -1))
  return await this.redis.llen(redisKey);
}

  async popMeetingBuffer(roomId: string) {
  const redisKey = `meeting:${roomId}:buffer`;
  const processingKey = `meeting:${roomId}:processing`;
  try {
    await this.redis.rename(redisKey, processingKey);
  } catch (e) {
    return [];
  }
  const data = await this.redis.lrange(processingKey, 0, -1);
  await this.redis.del(processingKey);
  return data.map(item => JSON.parse(item));
}
}
