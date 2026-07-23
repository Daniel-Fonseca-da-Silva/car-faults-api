import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IsNull, LessThanOrEqual } from 'typeorm';
import type { EntityManager } from 'typeorm';
import { VehicleModel } from './entities/vehicle-model.entity';
import { VehicleModelsRepository } from './vehicle-models.repository';

describe('VehicleModelsRepository', () => {
  let vehicleModelsRepository: VehicleModelsRepository;
  let repository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
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
      create: jest.fn(),
      save: jest.fn(),
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
});
