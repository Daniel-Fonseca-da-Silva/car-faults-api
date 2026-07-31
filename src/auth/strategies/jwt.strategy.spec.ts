import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '../../users/entities/user.entity';
import { UsersService } from '../../users/users.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let jwtStrategy: JwtStrategy;
  let usersService: { findById: jest.Mock };

  beforeEach(async () => {
    usersService = { findById: jest.fn() };
    const configService = { getOrThrow: jest.fn().mockReturnValue('secret') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: UsersService, useValue: usersService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    jwtStrategy = module.get(JwtStrategy);
  });

  it('should be defined', () => {
    expect(jwtStrategy).toBeDefined();
  });

  describe('validate', () => {
    it('returns the user matching the token subject', async () => {
      const user = { id: 'id-1' } as User;
      usersService.findById.mockResolvedValue(user);

      const result = await jwtStrategy.validate({ sub: 'id-1' });

      expect(usersService.findById).toHaveBeenCalledWith('id-1');
      expect(result).toBe(user);
    });

    it('throws UnauthorizedException when the user no longer exists', async () => {
      usersService.findById.mockRejectedValue(
        new NotFoundException('User id-1 not found'),
      );

      await expect(jwtStrategy.validate({ sub: 'id-1' })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('jwtFromRequest extractor', () => {
    function extract(req: unknown): string | null {
      const options = jwtStrategy as unknown as {
        _jwtFromRequest: (req: unknown) => string | null;
      };
      return options._jwtFromRequest(req);
    }

    it('extracts the token from the access_token cookie', () => {
      const req = { cookies: { access_token: 'cookie-jwt' }, headers: {} };

      expect(extract(req)).toBe('cookie-jwt');
    });

    it('falls back to the Authorization bearer header when there is no cookie', () => {
      const req = {
        cookies: {},
        headers: { authorization: 'Bearer header-jwt' },
      };

      expect(extract(req)).toBe('header-jwt');
    });

    it('returns null when neither the cookie nor the header carry a token', () => {
      const req = { cookies: {}, headers: {} };

      expect(extract(req)).toBeNull();
    });
  });
});
