import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserStats, UserStatsService } from './user-stats.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let usersController: UsersController;
  let usersService: { update: jest.Mock; softDelete: jest.Mock };
  let userStatsService: { getStats: jest.Mock };

  const user = {
    id: 'id-1',
    email: 'ana@example.com',
    name: 'Ana Silva',
    avatarUrl: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  } as User;

  beforeEach(async () => {
    usersService = { update: jest.fn(), softDelete: jest.fn() };
    userStatsService = { getStats: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: usersService },
        { provide: UserStatsService, useValue: userStatsService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    usersController = module.get(UsersController);
  });

  it('should be defined', () => {
    expect(usersController).toBeDefined();
  });

  describe('getProfile', () => {
    it("returns the authenticated user's serialized profile", () => {
      const req = { user } as unknown as Request;

      const result = usersController.getProfile(req);

      expect(result).toMatchObject({
        id: user.id,
        email: user.email,
        name: user.name,
      });
    });
  });

  describe('getMyStats', () => {
    it("returns the authenticated user's aggregated stats", async () => {
      const req = { user } as unknown as Request;
      const stats: UserStats = {
        searchesCount: 4,
        defectsConsultedCount: 2,
        savedVehiclesCount: 3,
        votesCount: 5,
        dislikesCount: 1,
        favoritedVehiclesCount: 2,
      };
      userStatsService.getStats.mockResolvedValue(stats);

      const result = await usersController.getMyStats(req);

      expect(userStatsService.getStats).toHaveBeenCalledWith(user.id);
      expect(result).toEqual(stats);
    });
  });

  describe('updateProfile', () => {
    it("updates and returns the authenticated user's profile", async () => {
      const req = { user } as unknown as Request;
      const dto: UpdateUserDto = { name: 'New Name' };
      const updatedUser = { ...user, name: 'New Name' };
      usersService.update.mockResolvedValue(updatedUser);

      const result = await usersController.updateProfile(req, dto);

      expect(usersService.update).toHaveBeenCalledWith(user.id, dto);
      expect(result).toMatchObject({ id: user.id, name: 'New Name' });
    });
  });

  describe('deleteProfile', () => {
    it("soft deletes the authenticated user's account", async () => {
      const req = { user } as unknown as Request;
      usersService.softDelete.mockResolvedValue(undefined);

      await usersController.deleteProfile(req);

      expect(usersService.softDelete).toHaveBeenCalledWith(user.id);
    });
  });
});
