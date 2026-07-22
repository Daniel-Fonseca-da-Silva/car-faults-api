import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersRepository } from './users.repository';

describe('UsersRepository', () => {
  let usersRepository: UsersRepository;
  let repository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    repository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        {
          provide: getRepositoryToken(User),
          useValue: repository,
        },
      ],
    }).compile();

    usersRepository = module.get(UsersRepository);
  });

  it('should be defined', () => {
    expect(usersRepository).toBeDefined();
  });

  describe('findById', () => {
    it('delegates to repository.findOne by id', async () => {
      const user = { id: 'id-1' } as User;
      repository.findOne.mockResolvedValue(user);

      const result = await usersRepository.findById('id-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'id-1' },
      });
      expect(result).toBe(user);
    });
  });

  describe('findByEmail', () => {
    it('delegates to repository.findOne by email', async () => {
      const user = { email: 'a@b.com' } as User;
      repository.findOne.mockResolvedValue(user);

      const result = await usersRepository.findByEmail('a@b.com');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'a@b.com' },
      });
      expect(result).toBe(user);
    });
  });

  describe('findByGoogleId', () => {
    it('delegates to repository.findOne by googleId', async () => {
      const user = { googleId: 'google-1' } as User;
      repository.findOne.mockResolvedValue(user);

      const result = await usersRepository.findByGoogleId('google-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { googleId: 'google-1' },
      });
      expect(result).toBe(user);
    });
  });

  describe('create', () => {
    it('delegates to repository.create', () => {
      const data = { email: 'a@b.com' };
      const user = { ...data } as User;
      repository.create.mockReturnValue(user);

      const result = usersRepository.create(data);

      expect(repository.create).toHaveBeenCalledWith(data);
      expect(result).toBe(user);
    });
  });

  describe('save', () => {
    it('delegates to repository.save', async () => {
      const user = { id: 'id-1' } as User;
      repository.save.mockResolvedValue(user);

      const result = await usersRepository.save(user);

      expect(repository.save).toHaveBeenCalledWith(user);
      expect(result).toBe(user);
    });
  });
});
