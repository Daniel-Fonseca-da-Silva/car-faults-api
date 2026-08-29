import { LookupLocale } from '../common/enums/lookup-locale.enum';
import { FuelType } from '../vehicle-models/enums/fuel-type.enum';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');
export const USER_CACHE_KEY_PREFIX = 'user:';
export const LOOKUP_CACHE_KEY_PREFIX = 'vehicle:lookup:';
export const USER_STATS_CACHE_KEY_PREFIX = 'user:stats:';
export const OAUTH_CODE_CACHE_KEY_PREFIX = 'oauth:code:';
export const JWT_DENY_CACHE_KEY_PREFIX = 'jwt:deny:';
export const PLATFORM_STATS_CACHE_KEY = 'platform:stats';
export const PLATFORM_FAULTS_CACHE_KEY_PREFIX = 'platform:faults:';

export function userStatsCacheKey(userId: string): string {
  return `${USER_STATS_CACHE_KEY_PREFIX}${userId}`;
}

export function oauthCodeCacheKey(code: string): string {
  return `${OAUTH_CODE_CACHE_KEY_PREFIX}${code}`;
}

export function jwtDenyCacheKey(jti: string): string {
  return `${JWT_DENY_CACHE_KEY_PREFIX}${jti}`;
}

export interface PlatformFaultsCacheKeyCriteria {
  locale: LookupLocale;
  limit: number;
  cursor?: string;
  brand?: string;
  model?: string;
  year?: number;
  fuelType?: FuelType;
  doors?: number;
  engine?: string;
}

export function platformFaultsCacheKey(
  criteria: PlatformFaultsCacheKeyCriteria,
): string {
  const { locale, limit, cursor, brand, model, year, fuelType, doors, engine } =
    criteria;
  return (
    `${PLATFORM_FAULTS_CACHE_KEY_PREFIX}${locale}:${limit}:${cursor ?? ''}:` +
    `${brand ?? ''}:${model ?? ''}:${year ?? ''}:${fuelType ?? ''}:` +
    `${doors ?? ''}:${engine ?? ''}`
  );
}
