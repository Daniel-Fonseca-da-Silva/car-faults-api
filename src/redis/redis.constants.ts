export const REDIS_CLIENT = Symbol('REDIS_CLIENT');
export const USER_CACHE_KEY_PREFIX = 'user:';
export const LOOKUP_CACHE_KEY_PREFIX = 'vehicle:lookup:';
export const USER_STATS_CACHE_KEY_PREFIX = 'user:stats:';

export function userStatsCacheKey(userId: string): string {
  return `${USER_STATS_CACHE_KEY_PREFIX}${userId}`;
}
