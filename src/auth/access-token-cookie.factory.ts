import { ConfigService } from '@nestjs/config';
import { CookieOptions } from 'express';

export const ACCESS_TOKEN_COOKIE_NAME = 'access_token';

type SameSite = 'lax' | 'strict' | 'none';
const VALID_SAME_SITE: readonly SameSite[] = ['lax', 'strict', 'none'];
const DEFAULT_SAME_SITE: SameSite = 'lax';

function resolveSameSite(config: ConfigService): SameSite {
  const value = config.get<string>('COOKIE_SAME_SITE', DEFAULT_SAME_SITE);
  return VALID_SAME_SITE.includes(value as SameSite)
    ? (value as SameSite)
    : DEFAULT_SAME_SITE;
}

export function createAccessTokenCookieOptions(
  config: ConfigService,
): CookieOptions {
  return {
    httpOnly: true,
    path: '/',
    sameSite: resolveSameSite(config),
    secure: config.get<string>('COOKIE_SECURE', 'false') === 'true',
  };
}
