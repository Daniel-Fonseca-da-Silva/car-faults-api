import { BadRequestException } from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { ActivityLogController } from './activity-log.controller';
import { ActivityLogService } from './activity-log.service';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { ActivityLog } from './entities/activity-log.entity';
import { ActivityLogType } from './enums/activity-log-type.enum';

describe('ActivityLogController', () => {
  let activityLogController: ActivityLogController;
  let activityLogService: {
    recordDefectConsulted: jest.Mock;
    favoriteVehicle: jest.Mock;
    unfavoriteVehicle: jest.Mock;
    isFavorited: jest.Mock;
    findFavorites: jest.Mock;
  };

  const user = { id: 'user-1' } as User;
  const req = { user } as unknown as Request;

  const activityLog = {
    id: 'log-1',
    userId: 'user-1',
    type: ActivityLogType.DEFECT_CONSULTED,
    resourceId: 'ki-1',
    metadata: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  } as ActivityLog;

  beforeEach(async () => {
    activityLogService = {
      recordDefectConsulted: jest.fn(),
      favoriteVehicle: jest.fn(),
      unfavoriteVehicle: jest.fn(),
      isFavorited: jest.fn(),
      findFavorites: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivityLogController],
      providers: [
        { provide: ActivityLogService, useValue: activityLogService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    activityLogController = module.get(ActivityLogController);
  });

  it('should be defined', () => {
    expect(activityLogController).toBeDefined();
  });

  describe('create', () => {
    it('records a defect_consulted activity', async () => {
      const dto: CreateActivityLogDto = {
        type: ActivityLogType.DEFECT_CONSULTED,
        resourceId: 'ki-1',
      };
      activityLogService.recordDefectConsulted.mockResolvedValue(activityLog);

      const result = await activityLogController.create(req, dto);

      expect(activityLogService.recordDefectConsulted).toHaveBeenCalledWith(
        'user-1',
        'ki-1',
      );
      expect(activityLogService.favoriteVehicle).not.toHaveBeenCalled();
      expect(result).toMatchObject({
        id: 'log-1',
        type: ActivityLogType.DEFECT_CONSULTED,
      });
    });

    it('records a vehicle_favorite activity with the given year', async () => {
      const dto: CreateActivityLogDto = {
        type: ActivityLogType.VEHICLE_FAVORITE,
        resourceId: 'vm-1',
        year: 2001,
      };
      const favorite = {
        ...activityLog,
        type: ActivityLogType.VEHICLE_FAVORITE,
        resourceId: 'vm-1',
      } as ActivityLog;
      activityLogService.favoriteVehicle.mockResolvedValue(favorite);

      const result = await activityLogController.create(req, dto);

      expect(activityLogService.favoriteVehicle).toHaveBeenCalledWith(
        'user-1',
        'vm-1',
        2001,
      );
      expect(activityLogService.recordDefectConsulted).not.toHaveBeenCalled();
      expect(result).toMatchObject({
        id: 'log-1',
        type: ActivityLogType.VEHICLE_FAVORITE,
      });
    });
  });

  describe('findFavorites', () => {
    it('lists the favorites page for the authenticated user', async () => {
      activityLogService.findFavorites.mockResolvedValue({
        items: [],
        nextCursor: null,
      });

      const result = await activityLogController.findFavorites(req, {});

      expect(activityLogService.findFavorites).toHaveBeenCalledWith(
        'user-1',
        {},
      );
      expect(result).toMatchObject({ items: [], nextCursor: null });
    });
  });

  describe('getFavoriteStatus', () => {
    it('returns favorited: true when the service reports a favorite', async () => {
      activityLogService.isFavorited.mockResolvedValue(true);

      const result = await activityLogController.getFavoriteStatus(
        req,
        'vm-1',
        '2001',
      );

      expect(activityLogService.isFavorited).toHaveBeenCalledWith(
        'user-1',
        'vm-1',
        2001,
      );
      expect(result).toMatchObject({ vehicleModelId: 'vm-1', favorited: true });
    });

    it('returns favorited: false when the service reports no favorite', async () => {
      activityLogService.isFavorited.mockResolvedValue(false);

      const result = await activityLogController.getFavoriteStatus(
        req,
        'vm-1',
        '2001',
      );

      expect(result).toMatchObject({
        vehicleModelId: 'vm-1',
        favorited: false,
      });
    });

    it('throws BadRequestException when year is not an integer', async () => {
      await expect(
        activityLogController.getFavoriteStatus(req, 'vm-1', 'abc'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeFavorite', () => {
    it("removes a vehicle from the authenticated user's favorites", async () => {
      activityLogService.unfavoriteVehicle.mockResolvedValue(undefined);

      await activityLogController.removeFavorite(req, 'vm-1', '2001');

      expect(activityLogService.unfavoriteVehicle).toHaveBeenCalledWith(
        'user-1',
        'vm-1',
        2001,
      );
    });

    it('throws BadRequestException when year is not an integer', async () => {
      await expect(
        activityLogController.removeFavorite(req, 'vm-1', 'abc'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('route order', () => {
    it('declares GET favorites (list) before GET favorites/:vehicleModelId (status)', () => {
      const methodNames = Object.getOwnPropertyNames(
        ActivityLogController.prototype,
      ).filter((name) => name !== 'constructor');
      const prototype = ActivityLogController.prototype as unknown as Record<
        string,
        unknown
      >;
      const pathOf = (name: string): string =>
        Reflect.getMetadata(PATH_METADATA, prototype[name] as object) as string;

      const listIndex = methodNames.findIndex(
        (name) => pathOf(name) === 'favorites',
      );
      const statusIndex = methodNames.findIndex(
        (name) => name === 'getFavoriteStatus',
      );

      expect(pathOf('getFavoriteStatus')).toBe('favorites/:vehicleModelId');
      expect(listIndex).toBeGreaterThanOrEqual(0);
      expect(listIndex).toBeLessThan(statusIndex);
    });
  });
});
