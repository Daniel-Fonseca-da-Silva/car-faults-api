import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from './entities/user.entity';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let usersService: UsersService;
  let usersRepository: {
    findById: jest.Mock;
    findByEmail: jest.Mock;
    findByGoogleId: jest.Mock;
    findByGoogleIdIncludingDeleted: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    softDelete: jest.Mock;
    recover: jest.Mock;
  };

  beforeEach(async () => {
    usersRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByGoogleId: jest.fn(),
      findByGoogleIdIncludingDeleted: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
      recover: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: usersRepository,
        },
      ],
    }).compile();

    usersService = module.get(UsersService);
  });

  it('should be defined', () => {
    expect(usersService).toBeDefined();
  });

  describe('create', () => {
    const data = { email: 'a@b.com', name: 'Ana' };

    it('creates and persists a user when email is unique', async () => {
      const user = { id: 'id-1', ...data } as User;
      usersRepository.findByEmail.mockResolvedValue(null);
      usersRepository.create.mockReturnValue(user);
      usersRepository.save.mockResolvedValue(user);

      const result = await usersService.create(data);

      expect(usersRepository.findByEmail).toHaveBeenCalledWith(data.email);
      expect(usersRepository.create).toHaveBeenCalledWith(data);
      expect(usersRepository.save).toHaveBeenCalledWith(user);
      expect(result).toBe(user);
    });

    it('throws ConflictException when email is already registered', async () => {
      usersRepository.findByEmail.mockResolvedValue({ id: 'id-1' });

      await expect(usersService.create(data)).rejects.toThrow(
        ConflictException,
      );
      expect(usersRepository.create).not.toHaveBeenCalled();
    });

    it('throws ConflictException when googleId is already registered', async () => {
      const dataWithGoogleId = { ...data, googleId: 'google-1' };
      usersRepository.findByEmail.mockResolvedValue(null);
      usersRepository.findByGoogleId.mockResolvedValue({
        id: 'id-1',
      });

      await expect(usersService.create(dataWithGoogleId)).rejects.toThrow(
        ConflictException,
      );
      expect(usersRepository.create).not.toHaveBeenCalled();
    });

    it('creates and persists a user when googleId is provided and unique', async () => {
      const dataWithGoogleId = { ...data, googleId: 'google-1' };
      const user = { id: 'id-1', ...dataWithGoogleId } as User;
      usersRepository.findByEmail.mockResolvedValue(null);
      usersRepository.findByGoogleId.mockResolvedValue(null);
      usersRepository.create.mockReturnValue(user);
      usersRepository.save.mockResolvedValue(user);

      const result = await usersService.create(dataWithGoogleId);

      expect(usersRepository.findByGoogleId).toHaveBeenCalledWith('google-1');
      expect(result).toBe(user);
    });

    it('does not check googleId uniqueness when it is not provided', async () => {
      const user = { id: 'id-1', ...data } as User;
      usersRepository.findByEmail.mockResolvedValue(null);
      usersRepository.create.mockReturnValue(user);
      usersRepository.save.mockResolvedValue(user);

      await usersService.create(data);

      expect(usersRepository.findByGoogleId).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('returns the user when found', async () => {
      const user = { id: 'id-1' } as User;
      usersRepository.findById.mockResolvedValue(user);

      const result = await usersService.findById('id-1');

      expect(result).toBe(user);
    });

    it('throws NotFoundException when the user does not exist', async () => {
      usersRepository.findById.mockResolvedValue(null);

      await expect(usersService.findById('id-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByEmail', () => {
    it('returns the user when found', async () => {
      const user = { email: 'a@b.com' } as User;
      usersRepository.findByEmail.mockResolvedValue(user);

      const result = await usersService.findByEmail('a@b.com');

      expect(result).toBe(user);
    });

    it('throws NotFoundException when the user does not exist', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);

      await expect(usersService.findByEmail('a@b.com')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByGoogleId', () => {
    it('returns the user when found', async () => {
      const user = { googleId: 'google-1' } as User;
      usersRepository.findByGoogleId.mockResolvedValue(user);

      const result = await usersService.findByGoogleId('google-1');

      expect(result).toBe(user);
    });

    it('throws NotFoundException when the user does not exist', async () => {
      usersRepository.findByGoogleId.mockResolvedValue(null);

      await expect(usersService.findByGoogleId('google-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOptionalByGoogleId', () => {
    it('returns the active user without recovering it', async () => {
      const user = { googleId: 'google-1', deletedAt: null } as User;
      usersRepository.findByGoogleIdIncludingDeleted.mockResolvedValue(user);

      const result = await usersService.findOptionalByGoogleId('google-1');

      expect(
        usersRepository.findByGoogleIdIncludingDeleted,
      ).toHaveBeenCalledWith('google-1');
      expect(usersRepository.recover).not.toHaveBeenCalled();
      expect(result).toBe(user);
    });

    it('recovers and returns the user when it was soft deleted', async () => {
      const user = {
        googleId: 'google-1',
        deletedAt: new Date('2026-01-01'),
      } as User;
      const recoveredUser = { ...user, deletedAt: null };
      usersRepository.findByGoogleIdIncludingDeleted.mockResolvedValue(user);
      usersRepository.recover.mockResolvedValue(recoveredUser);

      const result = await usersService.findOptionalByGoogleId('google-1');

      expect(usersRepository.recover).toHaveBeenCalledWith(user);
      expect(result).toBe(recoveredUser);
    });

    it('returns null when the user does not exist', async () => {
      usersRepository.findByGoogleIdIncludingDeleted.mockResolvedValue(null);

      const result = await usersService.findOptionalByGoogleId('google-1');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('updates and persists an existing user', async () => {
      const user = { id: 'id-1', name: 'Old Name' } as User;
      const updated = { ...user, name: 'New Name' };
      usersRepository.findById.mockResolvedValue(user);
      usersRepository.save.mockResolvedValue(updated);

      const result = await usersService.update('id-1', { name: 'New Name' });

      expect(usersRepository.findById).toHaveBeenCalledWith('id-1');
      expect(usersRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'id-1', name: 'New Name' }),
      );
      expect(result).toBe(updated);
    });

    it('throws NotFoundException when the user does not exist', async () => {
      usersRepository.findById.mockResolvedValue(null);

      await expect(
        usersService.update('id-1', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
      expect(usersRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('softDelete', () => {
    it('soft deletes an existing user', async () => {
      const user = { id: 'id-1' } as User;
      usersRepository.findById.mockResolvedValue(user);

      await usersService.softDelete('id-1');

      expect(usersRepository.findById).toHaveBeenCalledWith('id-1');
      expect(usersRepository.softDelete).toHaveBeenCalledWith('id-1');
    });

    it('throws NotFoundException when the user does not exist', async () => {
      usersRepository.findById.mockResolvedValue(null);

      await expect(usersService.softDelete('id-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(usersRepository.softDelete).not.toHaveBeenCalled();
    });
  });
});
