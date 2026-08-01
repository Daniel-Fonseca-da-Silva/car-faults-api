import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: {
    findOptionalByGoogleId: jest.Mock;
    create: jest.Mock;
  };
  let jwtService: { sign: jest.Mock; decode: jest.Mock };
  let cache: { get: jest.Mock; set: jest.Mock; del: jest.Mock };

  const profile = {
    googleId: 'google-1',
    email: 'ana@example.com',
    name: 'Ana Silva',
    avatarUrl: 'https://cdn.example.com/ana.jpg',
  };

  beforeEach(async () => {
    usersService = {
      findOptionalByGoogleId: jest.fn(),
      create: jest.fn(),
    };
    jwtService = { sign: jest.fn(), decode: jest.fn() };
    cache = { get: jest.fn(), set: jest.fn(), del: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
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

    it('creates a new user when none is found by googleId', async () => {
      const user = { id: 'id-1', ...profile } as unknown as User;
      usersService.findOptionalByGoogleId.mockResolvedValue(null);
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

      expect(jwtService.sign).toHaveBeenCalledWith({ sub: user.id });
      expect(result.accessToken).toBe('signed-jwt');
      expect(result.user).toMatchObject({
        id: user.id,
        email: user.email,
        name: user.name,
      });
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
});
