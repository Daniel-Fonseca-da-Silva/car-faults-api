import { PATH_METADATA } from '@nestjs/common/constants';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LookupLocale } from '../common/enums/lookup-locale.enum';
import { KnownIssue } from '../known-issues/entities/known-issue.entity';
import { User } from '../users/entities/user.entity';
import { CreateUserVehicleDto } from './dto/create-user-vehicle.dto';
import { UpdateUserVehicleDto } from './dto/update-user-vehicle.dto';
import { UserVehicle } from './entities/user-vehicle.entity';
import { UserVehiclesController } from './user-vehicles.controller';
import { UserVehiclesService } from './user-vehicles.service';

describe('UserVehiclesController', () => {
  let userVehiclesController: UserVehiclesController;
  let userVehiclesService: {
    findAllByUserWithIssueCounts: jest.Mock;
    status: jest.Mock;
    findOneByUser: jest.Mock;
    findKnownIssues: jest.Mock;
    countKnownIssues: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  const user = { id: 'user-1' } as User;
  const req = { user } as unknown as Request;

  const userVehicle = {
    id: 'uv-1',
    userId: 'user-1',
    vehicleModelId: 'vm-1',
    brand: 'Volkswagen',
    model: 'Polo',
    year: 2001,
    engine: '1.0',
    name: null,
    doors: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  } as UserVehicle;

  beforeEach(async () => {
    userVehiclesService = {
      findAllByUserWithIssueCounts: jest.fn(),
      status: jest.fn(),
      findOneByUser: jest.fn(),
      findKnownIssues: jest.fn(),
      countKnownIssues: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserVehiclesController],
      providers: [
        { provide: UserVehiclesService, useValue: userVehiclesService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    userVehiclesController = module.get(UserVehiclesController);
  });

  it('should be defined', () => {
    expect(userVehiclesController).toBeDefined();
  });

  describe('findAll', () => {
    it("returns the authenticated user's serialized garage page with issue counts", async () => {
      userVehiclesService.findAllByUserWithIssueCounts.mockResolvedValue({
        items: [{ userVehicle, knownIssuesCount: 2 }],
        nextCursor: null,
      });

      const result = await userVehiclesController.findAll(req, {});

      expect(
        userVehiclesService.findAllByUserWithIssueCounts,
      ).toHaveBeenCalledWith('user-1', {});
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({
        id: 'uv-1',
        brand: 'Volkswagen',
        knownIssuesCount: 2,
      });
      expect(result.nextCursor).toBeNull();
    });

    it('propagates the given query, including language, cursor and limit', async () => {
      userVehiclesService.findAllByUserWithIssueCounts.mockResolvedValue({
        items: [],
        nextCursor: 'next-cursor',
      });

      const query = { language: LookupLocale.PtPt, cursor: 'abc', limit: 10 };
      const result = await userVehiclesController.findAll(req, query);

      expect(
        userVehiclesService.findAllByUserWithIssueCounts,
      ).toHaveBeenCalledWith('user-1', query);
      expect(result.nextCursor).toBe('next-cursor');
    });
  });

  describe('status', () => {
    it("returns owned: true when the vehicle is in the user's garage", async () => {
      userVehiclesService.status.mockResolvedValue(true);

      const result = await userVehiclesController.status(req, {
        vehicleModelId: 'vm-1',
        year: 2001,
      });

      expect(userVehiclesService.status).toHaveBeenCalledWith(
        'user-1',
        'vm-1',
        2001,
      );
      expect(result).toMatchObject({
        vehicleModelId: 'vm-1',
        year: 2001,
        owned: true,
      });
    });

    it("returns owned: false when the vehicle is not in the user's garage", async () => {
      userVehiclesService.status.mockResolvedValue(false);

      const result = await userVehiclesController.status(req, {
        vehicleModelId: 'vm-1',
        year: 2001,
      });

      expect(result.owned).toBe(false);
    });
  });

  describe('findOne', () => {
    it('returns the vehicle detail with known issues', async () => {
      const knownIssues = [{ id: 'ki-1' }] as KnownIssue[];
      userVehiclesService.findOneByUser.mockResolvedValue(userVehicle);
      userVehiclesService.findKnownIssues.mockResolvedValue(knownIssues);

      const result = await userVehiclesController.findOne(req, 'uv-1', {});

      expect(userVehiclesService.findOneByUser).toHaveBeenCalledWith(
        'uv-1',
        'user-1',
      );
      expect(userVehiclesService.findKnownIssues).toHaveBeenCalledWith(
        userVehicle,
        undefined,
      );
      expect(result).toMatchObject({ id: 'uv-1' });
      expect(result.knownIssues).toHaveLength(1);
    });

    it('propagates the requested language', async () => {
      userVehiclesService.findOneByUser.mockResolvedValue(userVehicle);
      userVehiclesService.findKnownIssues.mockResolvedValue([]);

      await userVehiclesController.findOne(req, 'uv-1', {
        language: LookupLocale.PtPt,
      });

      expect(userVehiclesService.findKnownIssues).toHaveBeenCalledWith(
        userVehicle,
        LookupLocale.PtPt,
      );
    });
  });

  describe('create', () => {
    it("adds a vehicle to the authenticated user's garage", async () => {
      const dto: CreateUserVehicleDto = {
        brand: 'Volkswagen',
        model: 'Polo',
        year: 2001,
        engine: '1.0',
      };
      userVehiclesService.create.mockResolvedValue(userVehicle);
      userVehiclesService.countKnownIssues.mockResolvedValue(0);

      const result = await userVehiclesController.create(req, dto);

      expect(userVehiclesService.create).toHaveBeenCalledWith('user-1', dto);
      expect(userVehiclesService.countKnownIssues).toHaveBeenCalledWith(
        userVehicle,
      );
      expect(result).toMatchObject({ id: 'uv-1', knownIssuesCount: 0 });
    });
  });

  describe('update', () => {
    it("updates a vehicle in the authenticated user's garage", async () => {
      const dto: UpdateUserVehicleDto = { name: 'Meu Polo' };
      const updated = { ...userVehicle, name: 'Meu Polo' };
      userVehiclesService.update.mockResolvedValue(updated);
      userVehiclesService.countKnownIssues.mockResolvedValue(2);

      const result = await userVehiclesController.update(req, 'uv-1', dto);

      expect(userVehiclesService.update).toHaveBeenCalledWith(
        'uv-1',
        'user-1',
        dto,
      );
      expect(userVehiclesService.countKnownIssues).toHaveBeenCalledWith(
        updated,
      );
      expect(result).toMatchObject({
        id: 'uv-1',
        name: 'Meu Polo',
        knownIssuesCount: 2,
      });
    });
  });

  describe('remove', () => {
    it("removes a vehicle from the authenticated user's garage", async () => {
      userVehiclesService.remove.mockResolvedValue(undefined);

      await userVehiclesController.remove(req, 'uv-1');

      expect(userVehiclesService.remove).toHaveBeenCalledWith('uv-1', 'user-1');
    });
  });

  describe('route order', () => {
    it('declares GET status before GET :id', () => {
      const methodNames = Object.getOwnPropertyNames(
        UserVehiclesController.prototype,
      ).filter((name) => name !== 'constructor');
      const prototype = UserVehiclesController.prototype as unknown as Record<
        string,
        unknown
      >;
      const pathOf = (name: string): string =>
        Reflect.getMetadata(PATH_METADATA, prototype[name] as object) as string;

      const statusIndex = methodNames.findIndex(
        (name) => pathOf(name) === 'status',
      );
      const findOneIndex = methodNames.findIndex((name) => name === 'findOne');

      expect(pathOf('findOne')).toBe(':id');
      expect(statusIndex).toBeGreaterThanOrEqual(0);
      expect(statusIndex).toBeLessThan(findOneIndex);
    });
  });
});
