import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Not } from 'typeorm';
import { UserVehicle } from './entities/user-vehicle.entity';
import { UserVehiclesRepository } from './user-vehicles.repository';

describe('UserVehiclesRepository', () => {
  let userVehiclesRepository: UserVehiclesRepository;
  let repository: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };

  const uniqueKey = {
    userId: 'user-1',
    brand: 'Volkswagen',
    model: 'Polo',
    year: 2001,
    engine: '1.0',
  };

  beforeEach(async () => {
    repository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserVehiclesRepository,
        {
          provide: getRepositoryToken(UserVehicle),
          useValue: repository,
        },
      ],
    }).compile();

    userVehiclesRepository = module.get(UserVehiclesRepository);
  });

  it('should be defined', () => {
    expect(userVehiclesRepository).toBeDefined();
  });

  describe('findAllByUserId', () => {
    it('delegates to repository.find by userId', async () => {
      const userVehicles = [{ id: 'uv-1' }] as UserVehicle[];
      repository.find.mockResolvedValue(userVehicles);

      const result = await userVehiclesRepository.findAllByUserId('user-1');

      expect(repository.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(result).toBe(userVehicles);
    });
  });

  describe('findById', () => {
    it('delegates to repository.findOne by id', async () => {
      const userVehicle = { id: 'uv-1' } as UserVehicle;
      repository.findOne.mockResolvedValue(userVehicle);

      const result = await userVehiclesRepository.findById('uv-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'uv-1' },
      });
      expect(result).toBe(userVehicle);
    });
  });

  describe('findByUniqueKey', () => {
    it('queries by the unique key when no excludeId is given', async () => {
      const userVehicle = { id: 'uv-1' } as UserVehicle;
      repository.findOne.mockResolvedValue(userVehicle);

      const result = await userVehiclesRepository.findByUniqueKey(uniqueKey);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { ...uniqueKey },
      });
      expect(result).toBe(userVehicle);
    });

    it('excludes the given id when excludeId is provided', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await userVehiclesRepository.findByUniqueKey(
        uniqueKey,
        'uv-1',
      );

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { ...uniqueKey, id: Not('uv-1') },
      });
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('delegates to repository.create', () => {
      const data = { brand: 'Volkswagen' };
      const userVehicle = { ...data } as UserVehicle;
      repository.create.mockReturnValue(userVehicle);

      const result = userVehiclesRepository.create(data);

      expect(repository.create).toHaveBeenCalledWith(data);
      expect(result).toBe(userVehicle);
    });
  });

  describe('save', () => {
    it('delegates to repository.save', async () => {
      const userVehicle = { id: 'uv-1' } as UserVehicle;
      repository.save.mockResolvedValue(userVehicle);

      const result = await userVehiclesRepository.save(userVehicle);

      expect(repository.save).toHaveBeenCalledWith(userVehicle);
      expect(result).toBe(userVehicle);
    });
  });

  describe('delete', () => {
    it('delegates to repository.delete', async () => {
      repository.delete.mockResolvedValue(undefined);

      await userVehiclesRepository.delete('uv-1');

      expect(repository.delete).toHaveBeenCalledWith('uv-1');
    });
  });
});
