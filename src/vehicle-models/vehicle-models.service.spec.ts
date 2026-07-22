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
  };

  const criteria = {
    brand: 'Volkswagen',
    model: 'Polo',
    year: 2001,
    engine: '1.0',
  };

  beforeEach(async () => {
    vehicleModelsRepository = {
      findById: jest.fn(),
      findByLookup: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehicleModelsService,
        {
          provide: VehicleModelsRepository,
          useValue: vehicleModelsRepository,
        },
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
  });
});
