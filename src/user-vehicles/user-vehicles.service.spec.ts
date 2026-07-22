import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { KnownIssue } from '../known-issues/entities/known-issue.entity';
import { KnownIssuesService } from '../known-issues/known-issues.service';
import { VehicleModel } from '../vehicle-models/entities/vehicle-model.entity';
import { VehicleModelsService } from '../vehicle-models/vehicle-models.service';
import { UserVehicle } from './entities/user-vehicle.entity';
import { UserVehiclesRepository } from './user-vehicles.repository';
import { UserVehiclesService } from './user-vehicles.service';

describe('UserVehiclesService', () => {
  let userVehiclesService: UserVehiclesService;
  let userVehiclesRepository: {
    findAllByUserId: jest.Mock;
    findById: jest.Mock;
    findByUniqueKey: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };
  let vehicleModelsService: { findById: jest.Mock; findByLookup: jest.Mock };
  let knownIssuesService: { findByVehicleModelId: jest.Mock };

  const userId = 'user-1';

  const buildUserVehicle = (overrides: Partial<UserVehicle> = {}) =>
    ({
      id: 'uv-1',
      userId,
      vehicleModelId: null,
      brand: 'Volkswagen',
      model: 'Polo',
      year: 2001,
      engine: '1.0',
      name: null,
      doors: null,
      ...overrides,
    }) as UserVehicle;

  beforeEach(async () => {
    userVehiclesRepository = {
      findAllByUserId: jest.fn(),
      findById: jest.fn(),
      findByUniqueKey: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    vehicleModelsService = {
      findById: jest.fn(),
      findByLookup: jest.fn(),
    };
    knownIssuesService = { findByVehicleModelId: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserVehiclesService,
        {
          provide: UserVehiclesRepository,
          useValue: userVehiclesRepository,
        },
        { provide: VehicleModelsService, useValue: vehicleModelsService },
        { provide: KnownIssuesService, useValue: knownIssuesService },
      ],
    }).compile();

    userVehiclesService = module.get(UserVehiclesService);
  });

  it('should be defined', () => {
    expect(userVehiclesService).toBeDefined();
  });

  describe('findAllByUser', () => {
    it('delegates to the repository', async () => {
      const userVehicles = [buildUserVehicle()];
      userVehiclesRepository.findAllByUserId.mockResolvedValue(userVehicles);

      const result = await userVehiclesService.findAllByUser(userId);

      expect(userVehiclesRepository.findAllByUserId).toHaveBeenCalledWith(
        userId,
      );
      expect(result).toBe(userVehicles);
    });
  });

  describe('findOneByUser', () => {
    it('returns the vehicle when owned by the user', async () => {
      const userVehicle = buildUserVehicle();
      userVehiclesRepository.findById.mockResolvedValue(userVehicle);

      const result = await userVehiclesService.findOneByUser('uv-1', userId);

      expect(result).toBe(userVehicle);
    });

    it('throws NotFoundException when the vehicle does not exist', async () => {
      userVehiclesRepository.findById.mockResolvedValue(null);

      await expect(
        userVehiclesService.findOneByUser('uv-1', userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the vehicle belongs to another user', async () => {
      userVehiclesRepository.findById.mockResolvedValue(
        buildUserVehicle({ userId: 'other-user' }),
      );

      await expect(
        userVehiclesService.findOneByUser('uv-1', userId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findKnownIssues', () => {
    it('returns an empty array when the vehicle is not linked to the catalog', async () => {
      const result = await userVehiclesService.findKnownIssues(
        buildUserVehicle({ vehicleModelId: null }),
      );

      expect(result).toEqual([]);
      expect(knownIssuesService.findByVehicleModelId).not.toHaveBeenCalled();
    });

    it('delegates to KnownIssuesService when the vehicle is linked to the catalog', async () => {
      const knownIssues = [{ id: 'ki-1' }] as KnownIssue[];
      knownIssuesService.findByVehicleModelId.mockResolvedValue(knownIssues);

      const result = await userVehiclesService.findKnownIssues(
        buildUserVehicle({ vehicleModelId: 'vm-1' }),
      );

      expect(knownIssuesService.findByVehicleModelId).toHaveBeenCalledWith(
        'vm-1',
      );
      expect(result).toBe(knownIssues);
    });
  });

  describe('create', () => {
    it('creates a vehicle from brand/model/year/engine and links a catalog HIT', async () => {
      const vehicleModel = { id: 'vm-1', doors: 5 } as VehicleModel;
      vehicleModelsService.findByLookup.mockResolvedValue(vehicleModel);
      userVehiclesRepository.findByUniqueKey.mockResolvedValue(null);
      const created = buildUserVehicle();
      userVehiclesRepository.create.mockReturnValue(created);
      userVehiclesRepository.save.mockResolvedValue(created);

      const result = await userVehiclesService.create(userId, {
        brand: 'Volkswagen',
        model: 'Polo',
        year: 2001,
        engine: '1.0',
      });

      expect(vehicleModelsService.findByLookup).toHaveBeenCalledWith({
        brand: 'Volkswagen',
        model: 'Polo',
        year: 2001,
        engine: '1.0',
      });
      expect(userVehiclesRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          vehicleModelId: 'vm-1',
          brand: 'Volkswagen',
          model: 'Polo',
          year: 2001,
          engine: '1.0',
          doors: null,
          name: null,
        }),
      );
      expect(result).toBe(created);
    });

    it('leaves vehicleModelId null on a catalog MISS and keeps the given doors', async () => {
      vehicleModelsService.findByLookup.mockResolvedValue(null);
      userVehiclesRepository.findByUniqueKey.mockResolvedValue(null);
      const created = buildUserVehicle();
      userVehiclesRepository.create.mockReturnValue(created);
      userVehiclesRepository.save.mockResolvedValue(created);

      await userVehiclesService.create(userId, {
        brand: 'Volkswagen',
        model: 'Polo',
        year: 2001,
        engine: '1.0',
        doors: 3,
        name: 'Meu Polo',
      });

      expect(userVehiclesRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          vehicleModelId: null,
          doors: 3,
          name: 'Meu Polo',
        }),
      );
    });

    it('derives brand/model/engine/doors from the catalog when vehicleModelId is given', async () => {
      const vehicleModel = {
        id: 'vm-1',
        brand: 'Volkswagen',
        model: 'Polo',
        engine: '1.0',
        doors: 5,
      } as VehicleModel;
      vehicleModelsService.findById.mockResolvedValue(vehicleModel);
      userVehiclesRepository.findByUniqueKey.mockResolvedValue(null);
      const created = buildUserVehicle();
      userVehiclesRepository.create.mockReturnValue(created);
      userVehiclesRepository.save.mockResolvedValue(created);

      await userVehiclesService.create(userId, {
        vehicleModelId: 'vm-1',
        year: 2001,
        doors: 3,
      });

      expect(vehicleModelsService.findById).toHaveBeenCalledWith('vm-1');
      expect(vehicleModelsService.findByLookup).not.toHaveBeenCalled();
      expect(userVehiclesRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          vehicleModelId: 'vm-1',
          brand: 'Volkswagen',
          model: 'Polo',
          engine: '1.0',
          doors: 5,
        }),
      );
    });

    it('throws NotFoundException when vehicleModelId does not exist in the catalog', async () => {
      vehicleModelsService.findById.mockResolvedValue(null);

      await expect(
        userVehiclesService.create(userId, {
          vehicleModelId: 'missing',
          year: 2001,
        }),
      ).rejects.toThrow(NotFoundException);
      expect(userVehiclesRepository.create).not.toHaveBeenCalled();
    });

    it('throws ConflictException when the vehicle is already in the garage', async () => {
      vehicleModelsService.findByLookup.mockResolvedValue(null);
      userVehiclesRepository.findByUniqueKey.mockResolvedValue(
        buildUserVehicle(),
      );

      await expect(
        userVehiclesService.create(userId, {
          brand: 'Volkswagen',
          model: 'Polo',
          year: 2001,
          engine: '1.0',
        }),
      ).rejects.toThrow(ConflictException);
      expect(userVehiclesRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the vehicle does not exist', async () => {
      userVehiclesRepository.findById.mockResolvedValue(null);

      await expect(
        userVehiclesService.update('uv-1', userId, { name: 'New name' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the vehicle belongs to another user', async () => {
      userVehiclesRepository.findById.mockResolvedValue(
        buildUserVehicle({ userId: 'other-user' }),
      );

      await expect(
        userVehiclesService.update('uv-1', userId, { name: 'New name' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates name and doors without touching the catalog link', async () => {
      const userVehicle = buildUserVehicle({ doors: 3 });
      userVehiclesRepository.findById.mockResolvedValue(userVehicle);
      userVehiclesRepository.save.mockImplementation((uv) =>
        Promise.resolve(uv),
      );

      const result = await userVehiclesService.update('uv-1', userId, {
        name: 'New name',
        doors: 5,
      });

      expect(vehicleModelsService.findByLookup).not.toHaveBeenCalled();
      expect(vehicleModelsService.findById).not.toHaveBeenCalled();
      expect(userVehiclesRepository.findByUniqueKey).not.toHaveBeenCalled();
      expect(result.name).toBe('New name');
      expect(result.doors).toBe(5);
    });

    it('re-resolves the catalog link when brand/model/year/engine change', async () => {
      const userVehicle = buildUserVehicle({ vehicleModelId: null });
      userVehiclesRepository.findById.mockResolvedValue(userVehicle);
      userVehiclesRepository.findByUniqueKey.mockResolvedValue(null);
      const matched = { id: 'vm-2' } as VehicleModel;
      vehicleModelsService.findByLookup.mockResolvedValue(matched);
      userVehiclesRepository.save.mockImplementation((uv) =>
        Promise.resolve(uv),
      );

      const result = await userVehiclesService.update('uv-1', userId, {
        year: 2005,
      });

      expect(vehicleModelsService.findByLookup).toHaveBeenCalledWith({
        brand: 'Volkswagen',
        model: 'Polo',
        year: 2005,
        engine: '1.0',
      });
      expect(userVehiclesRepository.findByUniqueKey).toHaveBeenCalledWith(
        {
          userId,
          brand: 'Volkswagen',
          model: 'Polo',
          year: 2005,
          engine: '1.0',
        },
        'uv-1',
      );
      expect(result.vehicleModelId).toBe('vm-2');
      expect(result.year).toBe(2005);
    });

    it('derives fields from the catalog when vehicleModelId is set directly', async () => {
      const userVehicle = buildUserVehicle();
      userVehiclesRepository.findById.mockResolvedValue(userVehicle);
      userVehiclesRepository.findByUniqueKey.mockResolvedValue(null);
      const vehicleModel = {
        id: 'vm-3',
        brand: 'Peugeot',
        model: '206',
        engine: '1.4',
        doors: 5,
      } as VehicleModel;
      vehicleModelsService.findById.mockResolvedValue(vehicleModel);
      userVehiclesRepository.save.mockImplementation((uv) =>
        Promise.resolve(uv),
      );

      const result = await userVehiclesService.update('uv-1', userId, {
        vehicleModelId: 'vm-3',
      });

      expect(vehicleModelsService.findById).toHaveBeenCalledWith('vm-3');
      expect(result).toMatchObject({
        vehicleModelId: 'vm-3',
        brand: 'Peugeot',
        model: '206',
        engine: '1.4',
        doors: 5,
        year: 2001,
      });
    });

    it('overrides the year when both vehicleModelId and year are given', async () => {
      const userVehicle = buildUserVehicle();
      userVehiclesRepository.findById.mockResolvedValue(userVehicle);
      userVehiclesRepository.findByUniqueKey.mockResolvedValue(null);
      const vehicleModel = {
        id: 'vm-3',
        brand: 'Peugeot',
        model: '206',
        engine: '1.4',
        doors: 5,
      } as VehicleModel;
      vehicleModelsService.findById.mockResolvedValue(vehicleModel);
      userVehiclesRepository.save.mockImplementation((uv) =>
        Promise.resolve(uv),
      );

      const result = await userVehiclesService.update('uv-1', userId, {
        vehicleModelId: 'vm-3',
        year: 1999,
      });

      expect(result).toMatchObject({
        vehicleModelId: 'vm-3',
        year: 1999,
      });
    });

    it('overrides brand/model/engine via a re-resolved lookup while keeping the existing year', async () => {
      const userVehicle = buildUserVehicle();
      userVehiclesRepository.findById.mockResolvedValue(userVehicle);
      userVehiclesRepository.findByUniqueKey.mockResolvedValue(null);
      const matched = { id: 'vm-4' } as VehicleModel;
      vehicleModelsService.findByLookup.mockResolvedValue(matched);
      userVehiclesRepository.save.mockImplementation((uv) =>
        Promise.resolve(uv),
      );

      const result = await userVehiclesService.update('uv-1', userId, {
        brand: 'Peugeot',
        model: '206',
        engine: '1.4',
      });

      expect(vehicleModelsService.findByLookup).toHaveBeenCalledWith({
        brand: 'Peugeot',
        model: '206',
        year: 2001,
        engine: '1.4',
      });
      expect(result).toMatchObject({
        vehicleModelId: 'vm-4',
        brand: 'Peugeot',
        model: '206',
        engine: '1.4',
        year: 2001,
      });
    });

    it('throws NotFoundException when the given vehicleModelId does not exist', async () => {
      userVehiclesRepository.findById.mockResolvedValue(buildUserVehicle());
      vehicleModelsService.findById.mockResolvedValue(null);

      await expect(
        userVehiclesService.update('uv-1', userId, {
          vehicleModelId: 'missing',
        }),
      ).rejects.toThrow(NotFoundException);
      expect(userVehiclesRepository.save).not.toHaveBeenCalled();
    });

    it('throws ConflictException when the resolved combination already exists for another vehicle', async () => {
      userVehiclesRepository.findById.mockResolvedValue(buildUserVehicle());
      vehicleModelsService.findByLookup.mockResolvedValue(null);
      userVehiclesRepository.findByUniqueKey.mockResolvedValue(
        buildUserVehicle({ id: 'uv-2' }),
      );

      await expect(
        userVehiclesService.update('uv-1', userId, { year: 2005 }),
      ).rejects.toThrow(ConflictException);
      expect(userVehiclesRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes the vehicle when owned by the user', async () => {
      userVehiclesRepository.findById.mockResolvedValue(buildUserVehicle());

      await userVehiclesService.remove('uv-1', userId);

      expect(userVehiclesRepository.delete).toHaveBeenCalledWith('uv-1');
    });

    it('throws NotFoundException when the vehicle does not exist', async () => {
      userVehiclesRepository.findById.mockResolvedValue(null);

      await expect(userVehiclesService.remove('uv-1', userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(userVehiclesRepository.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the vehicle belongs to another user', async () => {
      userVehiclesRepository.findById.mockResolvedValue(
        buildUserVehicle({ userId: 'other-user' }),
      );

      await expect(userVehiclesService.remove('uv-1', userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(userVehiclesRepository.delete).not.toHaveBeenCalled();
    });
  });
});
