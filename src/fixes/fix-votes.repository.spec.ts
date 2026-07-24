import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FixVote } from './entities/fix-vote.entity';
import { FixVoteValue } from './enums/fix-vote-value.enum';
import { FixVotesRepository } from './fix-votes.repository';

describe('FixVotesRepository', () => {
  let fixVotesRepository: FixVotesRepository;
  let repository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(async () => {
    repository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FixVotesRepository,
        {
          provide: getRepositoryToken(FixVote),
          useValue: repository,
        },
      ],
    }).compile();

    fixVotesRepository = module.get(FixVotesRepository);
  });

  it('should be defined', () => {
    expect(fixVotesRepository).toBeDefined();
  });

  describe('findByFixAndUser', () => {
    it('queries by fixId and userId', async () => {
      const vote = { id: 'vote-1' } as FixVote;
      repository.findOne.mockResolvedValue(vote);

      const result = await fixVotesRepository.findByFixAndUser(
        'fix-1',
        'user-1',
      );

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { fixId: 'fix-1', userId: 'user-1' },
      });
      expect(result).toBe(vote);
    });
  });

  describe('create', () => {
    it('delegates to repository.create', () => {
      const data = {
        fixId: 'fix-1',
        userId: 'user-1',
        value: FixVoteValue.LIKE,
      };
      const created = { id: 'vote-1', ...data } as FixVote;
      repository.create.mockReturnValue(created);

      const result = fixVotesRepository.create(data);

      expect(repository.create).toHaveBeenCalledWith(data);
      expect(result).toBe(created);
    });
  });

  describe('save', () => {
    it('delegates to repository.save', async () => {
      const vote = { id: 'vote-1' } as FixVote;
      repository.save.mockResolvedValue(vote);

      const result = await fixVotesRepository.save(vote);

      expect(repository.save).toHaveBeenCalledWith(vote);
      expect(result).toBe(vote);
    });
  });

  describe('delete', () => {
    it('delegates to repository.delete', async () => {
      repository.delete.mockResolvedValue(undefined);

      await fixVotesRepository.delete('vote-1');

      expect(repository.delete).toHaveBeenCalledWith('vote-1');
    });
  });
});
