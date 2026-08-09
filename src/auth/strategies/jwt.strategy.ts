import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from '../../users/entities/user.entity';
import { UsersService } from '../../users/users.service';
import { ACCESS_TOKEN_COOKIE_NAME } from '../access-token-cookie.factory';
import { AuthService } from '../auth.service';

export interface JwtPayload {
  sub: string;
  jti?: string;
}

function cookieExtractor(req: Request): string | null {
  const cookies = req.cookies as Record<string, unknown> | undefined;
  const token = cookies?.[ACCESS_TOKEN_COOKIE_NAME];
  return typeof token === 'string' ? token : null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    if (
      payload.jti &&
      (await this.authService.isAccessTokenRevoked(payload.jti))
    ) {
      throw new UnauthorizedException('Access token has been revoked');
    }

    try {
      return await this.usersService.findById(payload.sub);
    } catch {
      throw new UnauthorizedException('User not found');
    }
  }
}
