import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions, JwtSignOptions } from '@nestjs/jwt';

const DEFAULT_JWT_EXPIRES_IN = '7d';

export function createJwtOptions(config: ConfigService): JwtModuleOptions {
  return {
    secret: config.getOrThrow<string>('JWT_SECRET'),
    signOptions: {
      expiresIn: config.get<string>(
        'JWT_EXPIRES_IN',
        DEFAULT_JWT_EXPIRES_IN,
      ) as JwtSignOptions['expiresIn'],
    },
  };
}
