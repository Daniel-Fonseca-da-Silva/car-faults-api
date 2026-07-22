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
});
