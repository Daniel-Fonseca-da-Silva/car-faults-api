import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { VehicleModel } from './entities/vehicle-model.entity';
import { VehicleModelsRepository } from './vehicle-models.repository';
import { VehicleModelsService } from './vehicle-models.service';

describe('VehicleModelsService', () => {
  let vehicleModelsService: VehicleModelsService;
  let vehicleModelsRepository: {
    findById: jest.Mock;
    findByLookup: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    findPaginated: jest.Mock;
    softDelete: jest.Mock;
    countAll: jest.Mock;
  };
  let cache: { del: jest.Mock };

  const criteria = {
    brand: 'Volkswagen',
    model: 'Polo',
    year: 2001,
    engine: '1.0',
  };

  const buildVehicleModel = (
    overrides: Partial<VehicleModel> = {},
  ): VehicleModel =>
    ({
      id: 'vm-1',
      brand: 'Volkswagen',
      model: 'Polo',
      yearFrom: 2001,
      yearTo: 2001,
      engine: '1.0',
      doors: null,
      fuelType: null,
      ...overrides,
    }) as VehicleModel;

  beforeEach(async () => {
    vehicleModelsRepository = {
      findById: jest.fn(),
      findByLookup: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      findPaginated: jest.fn(),
      softDelete: jest.fn(),
      countAll: jest.fn(),
    };
    cache = { del: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehicleModelsService,
        {
          provide: VehicleModelsRepository,
          useValue: vehicleModelsRepository,
        },
        { provide: CACHE_MANAGER, useValue: cache },
      ],
    }).compile();

    vehicleModelsService = module.get(VehicleModelsService);
  });

  it('should be defined', () => {
    expect(vehicleModelsService).toBeDefined();
  });

  describe('findById', () => {
    it('delegates to the repository', async () => {
      const vehicleModel = { id: 'vm-1' } as VehicleModel;
      vehicleModelsRepository.findById.mockResolvedValue(vehicleModel);

      const result = await vehicleModelsService.findById('vm-1');

      expect(vehicleModelsRepository.findById).toHaveBeenCalledWith('vm-1');
      expect(result).toBe(vehicleModel);
    });

    it('returns null when there is no match', async () => {
      vehicleModelsRepository.findById.mockResolvedValue(null);

      const result = await vehicleModelsService.findById('vm-1');

      expect(result).toBeNull();
    });
  });

  describe('findByLookup', () => {
    it('delegates to the repository', async () => {
      const vehicleModel = { id: 'vm-1' } as VehicleModel;
      vehicleModelsRepository.findByLookup.mockResolvedValue(vehicleModel);

      const result = await vehicleModelsService.findByLookup(criteria);

      expect(vehicleModelsRepository.findByLookup).toHaveBeenCalledWith(
        criteria,
      );
      expect(result).toBe(vehicleModel);
    });

    it('returns null when there is no match', async () => {
      vehicleModelsRepository.findByLookup.mockResolvedValue(null);

      const result = await vehicleModelsService.findByLookup(criteria);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates and saves the vehicle model using the given manager', async () => {
      const data = { brand: 'Volkswagen' };
      const created = { ...data } as VehicleModel;
      const saved = { ...created, id: 'vm-1' };
      const manager = {} as EntityManager;
      vehicleModelsRepository.create.mockReturnValue(created);
      vehicleModelsRepository.save.mockResolvedValue(saved);

      const result = await vehicleModelsService.create(data, manager);

      expect(vehicleModelsRepository.create).toHaveBeenCalledWith(data);
      expect(vehicleModelsRepository.save).toHaveBeenCalledWith(
        created,
        manager,
      );
      expect(result).toBe(saved);
    });

    it('creates and saves the vehicle model without a manager', async () => {
      const data = { brand: 'Volkswagen' };
      const created = { ...data } as VehicleModel;
      const saved = { ...created, id: 'vm-1' };
      vehicleModelsRepository.create.mockReturnValue(created);
      vehicleModelsRepository.save.mockResolvedValue(saved);

      const result = await vehicleModelsService.create(data);

      expect(vehicleModelsRepository.save).toHaveBeenCalledWith(
        created,
        undefined,
      );
      expect(result).toBe(saved);
    });
  });

  describe('findPaginated', () => {
    it('returns items and total from the repository', async () => {
      const items = [buildVehicleModel()];
      vehicleModelsRepository.findPaginated.mockResolvedValue([items, 1]);

      const result = await vehicleModelsService.findPaginated({
        page: 1,
        limit: 20,
      });

      expect(vehicleModelsRepository.findPaginated).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
      });
      expect(result).toEqual({ items, total: 1 });
    });
  });

  describe('update', () => {
    it('updates the vehicle model and evicts the lookup cache', async () => {
      const vehicleModel = buildVehicleModel();
      vehicleModelsRepository.findById.mockResolvedValue(vehicleModel);
      vehicleModelsRepository.save.mockImplementation((entity: VehicleModel) =>
        Promise.resolve(entity),
      );

      const result = await vehicleModelsService.update('vm-1', {
        name: 'Polo 6N1',
      });

      expect(result.name).toBe('Polo 6N1');
      expect(cache.del).toHaveBeenCalled();
    });

    it('throws NotFoundException when the vehicle model does not exist', async () => {
      vehicleModelsRepository.findById.mockResolvedValue(null);

      await expect(
        vehicleModelsService.update('missing', { name: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDelete', () => {
    it('soft deletes the vehicle model and evicts the lookup cache', async () => {
      const vehicleModel = buildVehicleModel();
      vehicleModelsRepository.findById.mockResolvedValue(vehicleModel);
      vehicleModelsRepository.softDelete.mockResolvedValue(undefined);

      await vehicleModelsService.softDelete('vm-1');

      expect(vehicleModelsRepository.softDelete).toHaveBeenCalledWith('vm-1');
      expect(cache.del).toHaveBeenCalled();
    });

    it('throws NotFoundException when the vehicle model does not exist', async () => {
      vehicleModelsRepository.findById.mockResolvedValue(null);

      await expect(vehicleModelsService.softDelete('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('countAll', () => {
    it('delegates to the repository', async () => {
      vehicleModelsRepository.countAll.mockResolvedValue(11);

      const result = await vehicleModelsService.countAll();

      expect(vehicleModelsRepository.countAll).toHaveBeenCalledWith();
      expect(result).toBe(11);
    });
  });
});
