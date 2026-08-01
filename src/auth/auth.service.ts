import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { oauthCodeCacheKey } from '../redis/redis.constants';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthResponseDto } from './dto/auth-response.dto';

export interface GoogleProfileData {
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

const OAUTH_CODE_TTL_MS = 60_000;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async validateGoogleProfile(profile: GoogleProfileData): Promise<User> {
    const existingUser = await this.usersService.findOptionalByGoogleId(
      profile.googleId,
    );
    if (existingUser) {
      return existingUser;
    }

    return this.usersService.create({
      email: profile.email,
      name: profile.name,
      googleId: profile.googleId,
      avatarUrl: profile.avatarUrl,
    });
  }

  login(user: User): AuthResponseDto {
    const accessToken = this.jwtService.sign({ sub: user.id });
    return new AuthResponseDto({
      accessToken,
      user: new UserResponseDto(user),
    });
  }

  resolveAccessTokenExpiryMs(accessToken: string): number {
    const { exp } = this.jwtService.decode<{ exp: number }>(accessToken);
    return Math.max(exp * 1000 - Date.now(), 0);
  }

  async createExchangeCode(accessToken: string): Promise<string> {
    const code = randomBytes(32).toString('base64url');
    await this.cache.set(
      oauthCodeCacheKey(code),
      accessToken,
      OAUTH_CODE_TTL_MS,
    );
    return code;
  }

  async consumeExchangeCode(code: string): Promise<string> {
    const key = oauthCodeCacheKey(code);
    const accessToken = await this.cache.get<string>(key);
    if (!accessToken) {
      throw new UnauthorizedException('Invalid or expired code');
    }

    await this.cache.del(key);
    return accessToken;
  }
}
