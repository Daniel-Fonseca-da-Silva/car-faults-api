import { isProductionEnvironment } from '../logger/pino-http.options';

export const JWT_SECRET_MIN_LENGTH = 32;

const REQUIRED_POSITIVE_INT_VARS = [
  'THROTTLE_TTL_MS',
  'THROTTLE_LIMIT',
  'THROTTLE_AUTH_TTL_MS',
  'THROTTLE_AUTH_LIMIT',
  'THROTTLE_LOOKUPS_TTL_MS',
  'THROTTLE_LOOKUPS_LIMIT',
  'THROTTLE_AI_MOBILE_TTL_MS',
  'THROTTLE_AI_MOBILE_LIMIT',
] as const;

type RawEnv = Record<string, unknown>;

function isPositiveInteger(value: unknown): boolean {
  return typeof value === 'string' && /^[1-9]\d*$/.test(value.trim());
}

/**
 * Validates environment variables at boot (ConfigModule `validate`), so a
 * misconfigured deploy fails fast instead of running with NaN throttle
 * limits, a weak JWT secret or production safety switches turned off.
 */
export function validateEnv(env: RawEnv): RawEnv {
  const errors: string[] = [];

  const jwtSecret = env.JWT_SECRET;
  if (typeof jwtSecret !== 'string' || jwtSecret.length < JWT_SECRET_MIN_LENGTH) {
    errors.push(
      `JWT_SECRET must be set and at least ${JWT_SECRET_MIN_LENGTH} characters long`,
    );
  }

  for (const name of REQUIRED_POSITIVE_INT_VARS) {
    if (!isPositiveInteger(env[name])) {
      errors.push(`${name} must be a positive integer`);
    }
  }

  if (env.COOKIE_SAME_SITE === 'none' && env.COOKIE_SECURE === 'false') {
    errors.push('COOKIE_SECURE cannot be "false" when COOKIE_SAME_SITE=none');
  }

  const nodeEnv = typeof env.NODE_ENV === 'string' ? env.NODE_ENV : undefined;
  if (isProductionEnvironment(nodeEnv)) {
    if (env.COOKIE_SECURE === 'false') {
      errors.push('COOKIE_SECURE must not be "false" in production');
    }
    if (env.TURNSTILE_ENABLED === 'false') {
      errors.push(
        'TURNSTILE_ENABLED must not be "false" in production; refusing to start with captcha disabled',
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration:\n- ${errors.join('\n- ')}`);
  }

  return env;
}
