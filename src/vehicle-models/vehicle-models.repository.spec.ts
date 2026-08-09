import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IsNull, LessThanOrEqual } from 'typeorm';
import type { EntityManager } from 'typeorm';
import { VehicleModel } from './entities/vehicle-model.entity';
import { FuelType } from './enums/fuel-type.enum';
import { VehicleModelsRepository } from './vehicle-models.repository';

describe('VehicleModelsRepository', () => {
  let vehicleModelsRepository: VehicleModelsRepository;
  let repository: {
    findOne: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    findAndCount: jest.Mock;
    count: jest.Mock;
    softDelete: jest.Mock;
  };

  const criteria = {
    brand: 'Volkswagen',
    model: 'Polo',
    year: 2001,
    engine: '1.0',
  };

  beforeEach(async () => {
    repository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      findAndCount: jest.fn(),
      count: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehicleModelsRepository,
        {
          provide: getRepositoryToken(VehicleModel),
          useValue: repository,
        },
      ],
    }).compile();

    vehicleModelsRepository = module.get(VehicleModelsRepository);
  });

  it('should be defined', () => {
    expect(vehicleModelsRepository).toBeDefined();
  });

  describe('findById', () => {
    it('delegates to repository.findOne by id', async () => {
      const vehicleModel = { id: 'vm-1' } as VehicleModel;
      repository.findOne.mockResolvedValue(vehicleModel);

      const result = await vehicleModelsRepository.findById('vm-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'vm-1' },
      });
      expect(result).toBe(vehicleModel);
    });
  });

  describe('findByLookup', () => {
    it('returns the open-ended match when found', async () => {
      const vehicleModel = { id: 'vm-1' } as VehicleModel;
      repository.findOne.mockResolvedValueOnce(vehicleModel);

      const result = await vehicleModelsRepository.findByLookup(criteria);

      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(result).toBe(vehicleModel);
    });

    it('falls back to a bounded-range match when no open-ended match exists', async () => {
      const vehicleModel = { id: 'vm-2' } as VehicleModel;
      repository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(vehicleModel);

      const result = await vehicleModelsRepository.findByLookup(criteria);

      expect(repository.findOne).toHaveBeenCalledTimes(2);
      expect(result).toBe(vehicleModel);
    });

    it('returns null when neither query matches', async () => {
      repository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const result = await vehicleModelsRepository.findByLookup(criteria);

      expect(result).toBeNull();
    });

    it('filters by doors when present in the criteria', async () => {
      const vehicleModel = { id: 'vm-3' } as VehicleModel;
      repository.findOne.mockResolvedValueOnce(vehicleModel);

      const result = await vehicleModelsRepository.findByLookup({
        ...criteria,
        doors: 3,
      });

      expect(repository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ doors: 3 }) as unknown,
        }),
      );
      expect(result).toBe(vehicleModel);
    });

    it('does not filter by doors when omitted from the criteria', async () => {
      const vehicleModel = { id: 'vm-4' } as VehicleModel;
      repository.findOne.mockResolvedValueOnce(vehicleModel);

      await vehicleModelsRepository.findByLookup(criteria);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          brand: criteria.brand,
          model: criteria.model,
          engine: criteria.engine,
          yearFrom: LessThanOrEqual(criteria.year),
          yearTo: IsNull(),
        },
      });
    });

    it('filters by fuelType when present in the criteria', async () => {
      const vehicleModel = { id: 'vm-5' } as VehicleModel;
      repository.findOne.mockResolvedValueOnce(vehicleModel);

      const result = await vehicleModelsRepository.findByLookup({
        ...criteria,
        fuelType: FuelType.DIESEL,
      });

      expect(repository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            fuelType: FuelType.DIESEL,
          }) as unknown,
        }),
      );
      expect(result).toBe(vehicleModel);
    });

    it('does not filter by fuelType when omitted from the criteria', async () => {
      const vehicleModel = { id: 'vm-6' } as VehicleModel;
      repository.findOne.mockResolvedValueOnce(vehicleModel);

      await vehicleModelsRepository.findByLookup(criteria);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          brand: criteria.brand,
          model: criteria.model,
          engine: criteria.engine,
          yearFrom: LessThanOrEqual(criteria.year),
          yearTo: IsNull(),
        },
      });
    });
  });

  describe('create', () => {
    it('delegates to repository.create', () => {
      const data = { brand: 'Volkswagen' };
      const vehicleModel = { ...data } as VehicleModel;
      repository.create.mockReturnValue(vehicleModel);

      const result = vehicleModelsRepository.create(data);

      expect(repository.create).toHaveBeenCalledWith(data);
      expect(result).toBe(vehicleModel);
    });
  });

  describe('save', () => {
    it('delegates to repository.save when no manager is given', async () => {
      const vehicleModel = { id: 'vm-1' } as VehicleModel;
      repository.save.mockResolvedValue(vehicleModel);

      const result = await vehicleModelsRepository.save(vehicleModel);

      expect(repository.save).toHaveBeenCalledWith(vehicleModel);
      expect(result).toBe(vehicleModel);
    });

    it('saves through the given manager when provided', async () => {
      const vehicleModel = { id: 'vm-1' } as VehicleModel;
      const managerRepository = {
        save: jest.fn().mockResolvedValue(vehicleModel),
      };
      const getRepository = jest.fn().mockReturnValue(managerRepository);
      const manager = { getRepository } as unknown as EntityManager;

      const result = await vehicleModelsRepository.save(vehicleModel, manager);

      expect(getRepository).toHaveBeenCalledWith(VehicleModel);
      expect(managerRepository.save).toHaveBeenCalledWith(vehicleModel);
      expect(repository.save).not.toHaveBeenCalled();
      expect(result).toBe(vehicleModel);
    });
  });

  describe('findPaginated', () => {
    it('paginates without brand/model filters', async () => {
      const vehicleModels = [{ id: 'vm-1' }] as VehicleModel[];
      repository.findAndCount.mockResolvedValue([vehicleModels, 1]);

      const result = await vehicleModelsRepository.findPaginated({
        page: 1,
        limit: 20,
      });

      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: {},
        order: { brand: 'ASC', model: 'ASC', yearFrom: 'ASC' },
        skip: 0,
        take: 20,
      });
      expect(result).toEqual([vehicleModels, 1]);
    });

    it('filters by brand and model and paginates the offset', async () => {
      repository.findAndCount.mockResolvedValue([[], 0]);

      await vehicleModelsRepository.findPaginated({
        page: 3,
        limit: 10,
        brand: 'Volkswagen',
        model: 'Polo',
      });

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        }),
      );
    });
  });

  describe('findByPathLookup', () => {
    const pathCriteria = {
      make: 'volkswagen',
      model: 'polo',
      year: 2001,
      fuelType: FuelType.DIESEL,
      engine: '1-0',
    };

    it('returns null when no candidate matches the slugs', async () => {
      repository.find.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

      const result =
        await vehicleModelsRepository.findByPathLookup(pathCriteria);

      expect(result).toBeNull();
    });

    it('matches a candidate by slugified brand, model and engine', async () => {
      const vehicleModel = {
        id: 'vm-1',
        brand: 'Volkswagen',
        model: 'Polo',
        engine: '1.0',
        doors: null,
      } as VehicleModel;
      repository.find
        .mockResolvedValueOnce([vehicleModel])
        .mockResolvedValueOnce([]);

      const result =
        await vehicleModelsRepository.findByPathLookup(pathCriteria);

      expect(result).toBe(vehicleModel);
    });

    it('excludes candidates whose slugified fields do not match', async () => {
      const wrongModel = {
        id: 'vm-2',
        brand: 'Volkswagen',
        model: 'Golf',
        engine: '1.0',
        doors: null,
      } as VehicleModel;
      repository.find
        .mockResolvedValueOnce([wrongModel])
        .mockResolvedValueOnce([]);

      const result =
        await vehicleModelsRepository.findByPathLookup(pathCriteria);

      expect(result).toBeNull();
    });

    it('prefers the candidate matching doors when doors is given and multiple match', async () => {
      const threeDoor = {
        id: 'vm-3',
        brand: 'Volkswagen',
        model: 'Polo',
        engine: '1.0',
        doors: 3,
      } as VehicleModel;
      const fiveDoor = {
        id: 'vm-4',
        brand: 'Volkswagen',
        model: 'Polo',
        engine: '1.0',
        doors: 5,
      } as VehicleModel;
      repository.find
        .mockResolvedValueOnce([threeDoor, fiveDoor])
        .mockResolvedValueOnce([]);

      const result = await vehicleModelsRepository.findByPathLookup({
        ...pathCriteria,
        doors: 5,
      });

      expect(result).toBe(fiveDoor);
    });

    it('falls back to the first stable candidate when doors is given but no candidate matches it', async () => {
      const threeDoor = {
        id: 'vm-3',
        brand: 'Volkswagen',
        model: 'Polo',
        engine: '1.0',
        doors: 3,
      } as VehicleModel;
      repository.find
        .mockResolvedValueOnce([threeDoor])
        .mockResolvedValueOnce([]);

      const result = await vehicleModelsRepository.findByPathLookup({
        ...pathCriteria,
        doors: 5,
      });

      expect(result).toBe(threeDoor);
    });

    it('returns the first stable candidate when doors is omitted and multiple match', async () => {
      const first = {
        id: 'vm-5',
        brand: 'Volkswagen',
        model: 'Polo',
        engine: '1.0',
        doors: 3,
      } as VehicleModel;
      const second = {
        id: 'vm-6',
        brand: 'Volkswagen',
        model: 'Polo',
        engine: '1.0',
        doors: 5,
      } as VehicleModel;
      repository.find
        .mockResolvedValueOnce([first, second])
        .mockResolvedValueOnce([]);

      const result =
        await vehicleModelsRepository.findByPathLookup(pathCriteria);

      expect(result).toBe(first);
    });
  });

  describe('findCatalogPaginated', () => {
    it('filters to vehicle models with a non-null fuelType and paginates the offset', async () => {
      const vehicleModels = [{ id: 'vm-1' }] as VehicleModel[];
      repository.findAndCount.mockResolvedValue([vehicleModels, 1]);

      const result = await vehicleModelsRepository.findCatalogPaginated({
        page: 2,
        limit: 20,
      });

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 20,
        }),
      );
      expect(result).toEqual([vehicleModels, 1]);
    });
  });

  describe('softDelete', () => {
    it('delegates to repository.softDelete', async () => {
      repository.softDelete.mockResolvedValue(undefined);

      await vehicleModelsRepository.softDelete('vm-1');

      expect(repository.softDelete).toHaveBeenCalledWith('vm-1');
    });
  });

  describe('countAll', () => {
    it('delegates to repository.count', async () => {
      repository.count.mockResolvedValue(8400);

      const result = await vehicleModelsRepository.countAll();

      expect(repository.count).toHaveBeenCalledWith();
      expect(result).toBe(8400);
    });
  });
});
