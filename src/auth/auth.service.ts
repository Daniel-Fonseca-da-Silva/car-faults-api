import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, randomUUID } from 'crypto';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { jwtDenyCacheKey, oauthCodeCacheKey } from '../redis/redis.constants';
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
  private readonly googleClient = new OAuth2Client();

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async validateGoogleProfile(profile: GoogleProfileData): Promise<User> {
    const existingByGoogleId = await this.usersService.findOptionalByGoogleId(
      profile.googleId,
    );
    if (existingByGoogleId) {
      return existingByGoogleId;
    }

    const existingByEmail = await this.usersService.findOptionalByEmail(
      profile.email,
    );
    if (existingByEmail) {
      if (!existingByEmail.googleId) {
        return this.usersService.update(existingByEmail.id, {
          googleId: profile.googleId,
        });
      }
      return existingByEmail;
    }

    return this.usersService.create({
      email: profile.email,
      name: profile.name,
      googleId: profile.googleId,
      avatarUrl: profile.avatarUrl,
    });
  }

  async loginWithGoogleMobileIdToken(
    idToken: string,
  ): Promise<AuthResponseDto> {
    const profile = await this.verifyGoogleMobileIdToken(idToken);
    const user = await this.validateGoogleProfile(profile);
    return this.login(user);
  }

  private async verifyGoogleMobileIdToken(
    idToken: string,
  ): Promise<GoogleProfileData> {
    const webClientId = this.config.getOrThrow<string>('GOOGLE_CLIENT_ID');
    const androidClientId = this.config.getOrThrow<string>(
      'GOOGLE_ANDROID_CLIENT_ID',
    );

    let payload: TokenPayload | undefined;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: [webClientId, androidClientId],
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Invalid Google ID token');
    }

    if (!payload?.sub || !payload.email) {
      throw new UnauthorizedException('Invalid Google ID token');
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name ?? payload.email,
      avatarUrl: payload.picture ?? null,
    };
  }

  login(user: User): AuthResponseDto {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      jti: randomUUID(),
    });
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

  async revokeAccessToken(accessToken: string): Promise<void> {
    let payload: { jti?: string; exp?: number } | null;
    try {
      payload = this.jwtService.decode<{ jti?: string; exp?: number }>(
        accessToken,
      );
    } catch {
      return;
    }
    if (!payload?.jti || !payload.exp) {
      return;
    }

    const ttlMs = Math.max(payload.exp * 1000 - Date.now(), 0);
    if (ttlMs === 0) {
      return;
    }

    await this.cache.set(jwtDenyCacheKey(payload.jti), '1', ttlMs);
  }

  async isAccessTokenRevoked(jti: string): Promise<boolean> {
    return Boolean(await this.cache.get(jwtDenyCacheKey(jti)));
  }
}
