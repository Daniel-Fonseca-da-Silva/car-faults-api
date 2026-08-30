import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

const verifyIdToken = jest.fn();
jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({ verifyIdToken })),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: {
    findOptionalByGoogleId: jest.Mock;
    findOptionalByEmail: jest.Mock;
    update: jest.Mock;
    create: jest.Mock;
  };
  let jwtService: { sign: jest.Mock; decode: jest.Mock };
  let cache: { get: jest.Mock; set: jest.Mock; del: jest.Mock };
  let configService: { getOrThrow: jest.Mock };

  const profile = {
    googleId: 'google-1',
    email: 'ana@example.com',
    name: 'Ana Silva',
    avatarUrl: 'https://cdn.example.com/ana.jpg',
  };

  beforeEach(async () => {
    usersService = {
      findOptionalByGoogleId: jest.fn(),
      findOptionalByEmail: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    };
    jwtService = { sign: jest.fn(), decode: jest.fn() };
    cache = { get: jest.fn(), set: jest.fn(), del: jest.fn() };
    configService = { getOrThrow: jest.fn() };

    usersService.findOptionalByEmail.mockResolvedValue(null);
    verifyIdToken.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: CACHE_MANAGER, useValue: cache },
      ],
    }).compile();

    authService = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('validateGoogleProfile', () => {
    it('returns the existing user when found by googleId', async () => {
      const user = { id: 'id-1', googleId: 'google-1' } as User;
      usersService.findOptionalByGoogleId.mockResolvedValue(user);

      const result = await authService.validateGoogleProfile(profile);

      expect(usersService.findOptionalByGoogleId).toHaveBeenCalledWith(
        'google-1',
      );
      expect(usersService.create).not.toHaveBeenCalled();
      expect(result).toBe(user);
    });

    it('creates a new user when none is found by googleId or email', async () => {
      const user = { id: 'id-1', ...profile } as unknown as User;
      usersService.findOptionalByGoogleId.mockResolvedValue(null);
      usersService.findOptionalByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(user);

      const result = await authService.validateGoogleProfile(profile);

      expect(usersService.create).toHaveBeenCalledWith({
        email: profile.email,
        name: profile.name,
        googleId: profile.googleId,
        avatarUrl: profile.avatarUrl,
      });
      expect(result).toBe(user);
    });

    it('links the googleId to an existing user found by email without one', async () => {
      const existingUser = {
        id: 'id-1',
        email: profile.email,
        googleId: null,
      } as unknown as User;
      const updatedUser = { ...existingUser, googleId: profile.googleId };
      usersService.findOptionalByGoogleId.mockResolvedValue(null);
      usersService.findOptionalByEmail.mockResolvedValue(existingUser);
      usersService.update.mockResolvedValue(updatedUser);

      const result = await authService.validateGoogleProfile(profile);

      expect(usersService.update).toHaveBeenCalledWith('id-1', {
        googleId: profile.googleId,
      });
      expect(usersService.create).not.toHaveBeenCalled();
      expect(result).toBe(updatedUser);
    });

    it('returns the existing user found by email when it already has a googleId', async () => {
      const existingUser = {
        id: 'id-1',
        email: profile.email,
        googleId: 'other-google-id',
      } as unknown as User;
      usersService.findOptionalByGoogleId.mockResolvedValue(null);
      usersService.findOptionalByEmail.mockResolvedValue(existingUser);

      const result = await authService.validateGoogleProfile(profile);

      expect(usersService.update).not.toHaveBeenCalled();
      expect(usersService.create).not.toHaveBeenCalled();
      expect(result).toBe(existingUser);
    });
  });

  describe('loginWithGoogleMobileIdToken', () => {
    beforeEach(() => {
      configService.getOrThrow.mockImplementation((key: string) => {
        if (key === 'GOOGLE_CLIENT_ID') return 'web-client-id';
        if (key === 'GOOGLE_ANDROID_CLIENT_ID') return 'android-client-id';
        throw new Error(`Unexpected config key ${key}`);
      });
    });

    it('verifies the id token against both audiences and logs the user in', async () => {
      const user = { id: 'id-1', ...profile } as unknown as User;
      verifyIdToken.mockResolvedValue({
        getPayload: () => ({
          sub: profile.googleId,
          email: profile.email,
          name: profile.name,
          picture: profile.avatarUrl,
        }),
      });
      usersService.findOptionalByGoogleId.mockResolvedValue(null);
      usersService.findOptionalByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(user);
      jwtService.sign.mockReturnValue('signed-jwt');

      const result = await authService.loginWithGoogleMobileIdToken('id-token');

      expect(verifyIdToken).toHaveBeenCalledWith({
        idToken: 'id-token',
        audience: ['web-client-id', 'android-client-id'],
      });
      expect(usersService.create).toHaveBeenCalledWith({
        email: profile.email,
        name: profile.name,
        googleId: profile.googleId,
        avatarUrl: profile.avatarUrl,
      });
      expect(result.accessToken).toBe('signed-jwt');
    });

    it('throws UnauthorizedException when the token cannot be verified', async () => {
      verifyIdToken.mockRejectedValue(new Error('bad token'));

      await expect(
        authService.loginWithGoogleMobileIdToken('id-token'),
      ).rejects.toThrow('Invalid Google ID token');
    });

    it('throws UnauthorizedException when the payload has no sub or email', async () => {
      verifyIdToken.mockResolvedValue({ getPayload: () => ({}) });

      await expect(
        authService.loginWithGoogleMobileIdToken('id-token'),
      ).rejects.toThrow('Invalid Google ID token');
    });
  });

  describe('login', () => {
    it('returns an access token and the serialized user', () => {
      const user = {
        id: 'id-1',
        email: 'ana@example.com',
        name: 'Ana Silva',
        avatarUrl: null,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      } as User;
      jwtService.sign.mockReturnValue('signed-jwt');

      const result = authService.login(user);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: user.id,
        jti: expect.any(String) as string,
      });
      expect(result.accessToken).toBe('signed-jwt');
      expect(result.user).toMatchObject({
        id: user.id,
        email: user.email,
        name: user.name,
      });
    });

    it('signs a different jti on each call', () => {
      const user = { id: 'id-1' } as User;
      jwtService.sign.mockReturnValue('signed-jwt');

      authService.login(user);
      authService.login(user);

      const calls = jwtService.sign.mock.calls as { jti: string }[][];
      expect(calls[0][0].jti).not.toBe(calls[1][0].jti);
    });
  });

  describe('resolveAccessTokenExpiryMs', () => {
    it('returns the milliseconds remaining until the token expiry', () => {
      const now = new Date('2026-01-01T00:00:00.000Z').getTime();
      jest.spyOn(Date, 'now').mockReturnValue(now);
      jwtService.decode.mockReturnValue({ exp: now / 1000 + 3600 });

      const result = authService.resolveAccessTokenExpiryMs('signed-jwt');

      expect(jwtService.decode).toHaveBeenCalledWith('signed-jwt');
      expect(result).toBe(3600000);
    });

    it('never returns a negative value for an already expired token', () => {
      const now = new Date('2026-01-01T00:00:00.000Z').getTime();
      jest.spyOn(Date, 'now').mockReturnValue(now);
      jwtService.decode.mockReturnValue({ exp: now / 1000 - 3600 });

      const result = authService.resolveAccessTokenExpiryMs('signed-jwt');

      expect(result).toBe(0);
    });
  });

  describe('createExchangeCode', () => {
    it('stores the access token under a generated code with a 60s TTL', async () => {
      const code = await authService.createExchangeCode('signed-jwt');

      expect(code).toEqual(expect.any(String));
      expect(cache.set).toHaveBeenCalledWith(
        `oauth:code:${code}`,
        'signed-jwt',
        60_000,
      );
    });

    it('generates a different code on each call', async () => {
      const first = await authService.createExchangeCode('signed-jwt');
      const second = await authService.createExchangeCode('signed-jwt');

      expect(first).not.toBe(second);
    });
  });

  describe('consumeExchangeCode', () => {
    it('returns the access token and deletes the code on a hit', async () => {
      cache.get.mockResolvedValue('signed-jwt');

      const result = await authService.consumeExchangeCode('xyz');

      expect(cache.get).toHaveBeenCalledWith('oauth:code:xyz');
      expect(cache.del).toHaveBeenCalledWith('oauth:code:xyz');
      expect(result).toBe('signed-jwt');
    });

    it('throws UnauthorizedException when the code is missing or expired', async () => {
      cache.get.mockResolvedValue(undefined);

      await expect(authService.consumeExchangeCode('missing')).rejects.toThrow(
        'Invalid or expired code',
      );
      expect(cache.del).not.toHaveBeenCalled();
    });

    it('rejects reuse of an already-consumed code', async () => {
      cache.get
        .mockResolvedValueOnce('signed-jwt')
        .mockResolvedValueOnce(undefined);

      await authService.consumeExchangeCode('xyz');

      await expect(authService.consumeExchangeCode('xyz')).rejects.toThrow(
        'Invalid or expired code',
      );
    });
  });

  describe('revokeAccessToken', () => {
    it('denylists the jti for the remaining TTL of the token', async () => {
      const now = new Date('2026-01-01T00:00:00.000Z').getTime();
      jest.spyOn(Date, 'now').mockReturnValue(now);
      jwtService.decode.mockReturnValue({
        jti: 'jti-1',
        exp: now / 1000 + 3600,
      });

      await authService.revokeAccessToken('signed-jwt');

      expect(cache.set).toHaveBeenCalledWith('jwt:deny:jti-1', '1', 3600000);
    });

    it('does nothing for a token without a jti', async () => {
      jwtService.decode.mockReturnValue({ exp: Date.now() / 1000 + 3600 });

      await authService.revokeAccessToken('signed-jwt');

      expect(cache.set).not.toHaveBeenCalled();
    });

    it('does nothing for an invalid token', async () => {
      jwtService.decode.mockImplementation(() => {
        throw new Error('malformed token');
      });

      await authService.revokeAccessToken('not-a-jwt');

      expect(cache.set).not.toHaveBeenCalled();
    });
  });

  describe('isAccessTokenRevoked', () => {
    it('returns true when the jti is denylisted', async () => {
      cache.get.mockResolvedValue('1');

      const result = await authService.isAccessTokenRevoked('jti-1');

      expect(cache.get).toHaveBeenCalledWith('jwt:deny:jti-1');
      expect(result).toBe(true);
    });

    it('returns false when the jti is not denylisted', async () => {
      cache.get.mockResolvedValue(undefined);

      const result = await authService.isAccessTokenRevoked('jti-1');

      expect(result).toBe(false);
    });
  });
});
