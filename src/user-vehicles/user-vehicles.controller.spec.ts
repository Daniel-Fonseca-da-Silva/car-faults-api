import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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
    findAllByUser: jest.Mock;
    findOneByUser: jest.Mock;
    findKnownIssues: jest.Mock;
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
      findAllByUser: jest.fn(),
      findOneByUser: jest.fn(),
      findKnownIssues: jest.fn(),
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
    it("returns the authenticated user's serialized garage", async () => {
      userVehiclesService.findAllByUser.mockResolvedValue([userVehicle]);

      const result = await userVehiclesController.findAll(req);

      expect(userVehiclesService.findAllByUser).toHaveBeenCalledWith('user-1');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: 'uv-1', brand: 'Volkswagen' });
    });
  });

  describe('findOne', () => {
    it('returns the vehicle detail with known issues', async () => {
      const knownIssues = [{ id: 'ki-1' }] as KnownIssue[];
      userVehiclesService.findOneByUser.mockResolvedValue(userVehicle);
      userVehiclesService.findKnownIssues.mockResolvedValue(knownIssues);

      const result = await userVehiclesController.findOne(req, 'uv-1');

      expect(userVehiclesService.findOneByUser).toHaveBeenCalledWith(
        'uv-1',
        'user-1',
      );
      expect(userVehiclesService.findKnownIssues).toHaveBeenCalledWith(
        userVehicle,
      );
      expect(result).toMatchObject({ id: 'uv-1' });
      expect(result.knownIssues).toHaveLength(1);
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

      const result = await userVehiclesController.create(req, dto);

      expect(userVehiclesService.create).toHaveBeenCalledWith('user-1', dto);
      expect(result).toMatchObject({ id: 'uv-1' });
    });
  });

  describe('update', () => {
    it("updates a vehicle in the authenticated user's garage", async () => {
      const dto: UpdateUserVehicleDto = { name: 'Meu Polo' };
      const updated = { ...userVehicle, name: 'Meu Polo' };
      userVehiclesService.update.mockResolvedValue(updated);

      const result = await userVehiclesController.update(req, 'uv-1', dto);

      expect(userVehiclesService.update).toHaveBeenCalledWith(
        'uv-1',
        'user-1',
        dto,
      );
      expect(result).toMatchObject({ id: 'uv-1', name: 'Meu Polo' });
    });
  });

  describe('remove', () => {
    it("removes a vehicle from the authenticated user's garage", async () => {
      userVehiclesService.remove.mockResolvedValue(undefined);

      await userVehiclesController.remove(req, 'uv-1');

      expect(userVehiclesService.remove).toHaveBeenCalledWith('uv-1', 'user-1');
    });
  });
});
