export const REDIS_CLIENT = Symbol('REDIS_CLIENT');
export const USER_CACHE_KEY_PREFIX = 'user:';
export const LOOKUP_CACHE_KEY_PREFIX = 'vehicle:lookup:';
export const USER_STATS_CACHE_KEY_PREFIX = 'user:stats:';
export const OAUTH_CODE_CACHE_KEY_PREFIX = 'oauth:code:';
export const PLATFORM_STATS_CACHE_KEY = 'platform:stats';
export const PLATFORM_TOP_FAULTS_CACHE_KEY_PREFIX = 'platform:top-faults:';

export function userStatsCacheKey(userId: string): string {
  return `${USER_STATS_CACHE_KEY_PREFIX}${userId}`;
}

export function oauthCodeCacheKey(code: string): string {
  return `${OAUTH_CODE_CACHE_KEY_PREFIX}${code}`;
}

export function platformTopFaultsCacheKey(
  locale: string,
  limit: number,
): string {
  return `${PLATFORM_TOP_FAULTS_CACHE_KEY_PREFIX}${locale}:${limit}`;
}
