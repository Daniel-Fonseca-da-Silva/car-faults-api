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
  let jwtService: { sign: jest.Mock };

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
    jwtService = { sign: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
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
});
