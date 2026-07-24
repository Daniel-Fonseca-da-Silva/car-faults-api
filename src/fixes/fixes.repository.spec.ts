import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { EntityManager } from 'typeorm';
import { Fix } from './entities/fix.entity';
import { FixVoteValue } from './enums/fix-vote-value.enum';
import { FixesRepository } from './fixes.repository';

describe('FixesRepository', () => {
  let fixesRepository: FixesRepository;
  let repository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let queryBuilder: {
    leftJoin: jest.Mock;
    addSelect: jest.Mock;
    groupBy: jest.Mock;
    addGroupBy: jest.Mock;
    where: jest.Mock;
    orderBy: jest.Mock;
    addOrderBy: jest.Mock;
    getRawAndEntities: jest.Mock;
  };

  beforeEach(async () => {
    queryBuilder = {
      leftJoin: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getRawAndEntities: jest.fn(),
    };
    repository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FixesRepository,
        {
          provide: getRepositoryToken(Fix),
          useValue: repository,
        },
      ],
    }).compile();

    fixesRepository = module.get(FixesRepository);
  });

  it('should be defined', () => {
    expect(fixesRepository).toBeDefined();
  });

  describe('saveMany', () => {
    it('saves through the given manager', async () => {
      const data = [{ summary: 'Replace synchros' }];
      const saved = [{ id: 'fix-1', ...data[0] }] as Fix[];
      const managerRepository = { save: jest.fn().mockResolvedValue(saved) };
      const getRepository = jest.fn().mockReturnValue(managerRepository);
      const manager = { getRepository } as unknown as EntityManager;

      const result = await fixesRepository.saveMany(data, manager);

      expect(getRepository).toHaveBeenCalledWith(Fix);
      expect(managerRepository.save).toHaveBeenCalledWith(data);
      expect(result).toBe(saved);
    });
  });

  describe('findById', () => {
    it('delegates to repository.findOne by id', async () => {
      const fix = { id: 'fix-1' } as Fix;
      repository.findOne.mockResolvedValue(fix);

      const result = await fixesRepository.findById('fix-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'fix-1' },
      });
      expect(result).toBe(fix);
    });
  });

  describe('create', () => {
    it('delegates to repository.create', () => {
      const data = { knownIssueId: 'ki-1', summary: 'Replace synchros' };
      const created = { id: 'fix-1', ...data } as Fix;
      repository.create.mockReturnValue(created);

      const result = fixesRepository.create(data);

      expect(repository.create).toHaveBeenCalledWith(data);
      expect(result).toBe(created);
    });
  });

  describe('save', () => {
    it('delegates to repository.save', async () => {
      const fix = { id: 'fix-1' } as Fix;
      repository.save.mockResolvedValue(fix);

      const result = await fixesRepository.save(fix);

      expect(repository.save).toHaveBeenCalledWith(fix);
      expect(result).toBe(fix);
    });
  });

  describe('delete', () => {
    it('delegates to repository.delete', async () => {
      repository.delete.mockResolvedValue(undefined);

      await fixesRepository.delete('fix-1');

      expect(repository.delete).toHaveBeenCalledWith('fix-1');
    });
  });

  describe('findByKnownIssueIdWithCounts', () => {
    it('queries counts ordered by likes desc, dislikes asc, createdAt asc', async () => {
      const fix = { id: 'fix-1' } as Fix;
      queryBuilder.getRawAndEntities.mockResolvedValue({
        entities: [fix],
        raw: [{ likes: '5', dislikes: '2', myVote: undefined }],
      });

      const result = await fixesRepository.findByKnownIssueIdWithCounts('ki-1');

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('fix');
      expect(queryBuilder.leftJoin).toHaveBeenCalledWith(
        'fix_votes',
        'vote',
        'vote.fix_id = fix.id',
      );
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'fix.known_issue_id = :knownIssueId',
        { knownIssueId: 'ki-1' },
      );
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('likes', 'DESC');
      expect(queryBuilder.addOrderBy).toHaveBeenCalledWith('dislikes', 'ASC');
      expect(queryBuilder.addOrderBy).toHaveBeenCalledWith(
        'fix.created_at',
        'ASC',
      );
      expect(result).toEqual([{ ...fix, likes: 5, dislikes: 2, myVote: null }]);
    });

    it('joins the requesting user vote to populate myVote', async () => {
      queryBuilder.getRawAndEntities.mockResolvedValue({
        entities: [],
        raw: [],
      });

      await fixesRepository.findByKnownIssueIdWithCounts('ki-1', 'user-1');

      expect(queryBuilder.leftJoin).toHaveBeenCalledWith(
        'fix_votes',
        'my_vote',
        'my_vote.fix_id = fix.id AND my_vote.user_id = :userId',
        { userId: 'user-1' },
      );
      expect(queryBuilder.addSelect).toHaveBeenCalledWith(
        'my_vote.value',
        'myVote',
      );
      expect(queryBuilder.addGroupBy).toHaveBeenCalledWith('my_vote.value');
    });
  });

  describe('findByIdWithCounts', () => {
    it('returns null when no fix matches', async () => {
      queryBuilder.getRawAndEntities.mockResolvedValue({
        entities: [],
        raw: [],
      });

      const result = await fixesRepository.findByIdWithCounts('missing');

      expect(queryBuilder.where).toHaveBeenCalledWith('fix.id = :id', {
        id: 'missing',
      });
      expect(result).toBeNull();
    });

    it('maps counts and myVote for the matching fix', async () => {
      const fix = { id: 'fix-1' } as Fix;
      queryBuilder.getRawAndEntities.mockResolvedValue({
        entities: [fix],
        raw: [{ likes: '1', dislikes: '0', myVote: FixVoteValue.LIKE }],
      });

      const result = await fixesRepository.findByIdWithCounts(
        'fix-1',
        'user-1',
      );

      expect(result).toEqual({
        ...fix,
        likes: 1,
        dislikes: 0,
        myVote: FixVoteValue.LIKE,
      });
    });
  });
});
