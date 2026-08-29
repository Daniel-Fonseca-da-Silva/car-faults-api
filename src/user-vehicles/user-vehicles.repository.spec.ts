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
    softDelete: jest.Mock;
    count: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let queryBuilder: {
    leftJoinAndSelect: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    orderBy: jest.Mock;
    addOrderBy: jest.Mock;
    take: jest.Mock;
    getMany: jest.Mock;
  };

  const uniqueKey = {
    userId: 'user-1',
    brand: 'Volkswagen',
    model: 'Polo',
    year: 2001,
    engine: '1.0',
  };

  beforeEach(async () => {
    queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };
    repository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
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

  describe('findPageByUserId', () => {
    it('joins vehicleModel, filters by user and orders by created_at/id desc', async () => {
      const userVehicles = [{ id: 'uv-1' }] as UserVehicle[];
      queryBuilder.getMany.mockResolvedValue(userVehicles);

      const result = await userVehiclesRepository.findPageByUserId(
        'user-1',
        20,
      );

      expect(repository.createQueryBuilder).toHaveBeenCalledWith(
        'user_vehicle',
      );
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'user_vehicle.vehicleModel',
        'vehicleModel',
      );
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'user_vehicle.user_id = :userId',
        { userId: 'user-1' },
      );
      expect(queryBuilder.orderBy).toHaveBeenCalledWith(
        'user_vehicle.created_at',
        'DESC',
      );
      expect(queryBuilder.addOrderBy).toHaveBeenCalledWith(
        'user_vehicle.id',
        'DESC',
      );
      expect(queryBuilder.take).toHaveBeenCalledWith(21);
      expect(result).toBe(userVehicles);
    });

    it('applies a keyset predicate when a cursor is given', async () => {
      queryBuilder.getMany.mockResolvedValue([]);

      await userVehiclesRepository.findPageByUserId('user-1', 20, {
        createdAt: '2026-01-01T00:00:00.000Z',
        id: 'uv-0',
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('user_vehicle.created_at'),
        expect.objectContaining({
          createdAt_cmp0: '2026-01-01T00:00:00.000Z',
          id_cmp1: 'uv-0',
        }),
      );
    });
  });

  describe('existsByVehicleModelAndYear', () => {
    it('returns true when at least one match exists', async () => {
      repository.count.mockResolvedValue(1);

      const result = await userVehiclesRepository.existsByVehicleModelAndYear(
        'user-1',
        'vm-1',
        2001,
      );

      expect(repository.count).toHaveBeenCalledWith({
        where: { userId: 'user-1', vehicleModelId: 'vm-1', year: 2001 },
      });
      expect(result).toBe(true);
    });

    it('returns false when no match exists', async () => {
      repository.count.mockResolvedValue(0);

      const result = await userVehiclesRepository.existsByVehicleModelAndYear(
        'user-1',
        'vm-1',
        2001,
      );

      expect(result).toBe(false);
    });
  });

  describe('findById', () => {
    it('delegates to repository.findOne by id', async () => {
      const userVehicle = { id: 'uv-1' } as UserVehicle;
      repository.findOne.mockResolvedValue(userVehicle);

      const result = await userVehiclesRepository.findById('uv-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'uv-1' },
        relations: { vehicleModel: true },
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

  describe('softDelete', () => {
    it('delegates to repository.softDelete', async () => {
      repository.softDelete.mockResolvedValue(undefined);

      await userVehiclesRepository.softDelete('uv-1');

      expect(repository.softDelete).toHaveBeenCalledWith('uv-1');
    });
  });

  describe('countByUserId', () => {
    it('counts vehicles scoped by userId', async () => {
      repository.count.mockResolvedValue(3);

      const result = await userVehiclesRepository.countByUserId('user-1');

      expect(repository.count).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(result).toBe(3);
    });
  });
});
