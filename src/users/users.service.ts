import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { errorMessage } from '../redis/redis-error.util';
import { USER_CACHE_KEY_PREFIX } from '../redis/redis.constants';
import { User } from './entities/user.entity';
import { UsersRepository } from './users.repository';

export interface CreateUserData {
  email: string;
  name: string;
  googleId?: string | null;
  avatarUrl?: string | null;
}

export interface UpdateUserData {
  name?: string;
  avatarUrl?: string | null;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async create(data: CreateUserData): Promise<User> {
    const existingByEmail = await this.usersRepository.findByEmail(data.email);
    if (existingByEmail) {
      throw new ConflictException('Email already registered');
    }

    if (data.googleId) {
      const existingByGoogleId = await this.usersRepository.findByGoogleId(
        data.googleId,
      );
      if (existingByGoogleId) {
        throw new ConflictException('Google account already registered');
      }
    }

    const user = this.usersRepository.create(data);
    return this.usersRepository.save(user);
  }

  async findById(id: string): Promise<User> {
    const cacheKey = this.userCacheKey(id);
    const cached = await this.getCached(cacheKey);
    if (cached) {
      return cached;
    }

    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    await this.setCached(cacheKey, user);
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return user;
  }

  async findByGoogleId(googleId: string): Promise<User> {
    const user = await this.usersRepository.findByGoogleId(googleId);
    if (!user) {
      throw new NotFoundException(`User with google id ${googleId} not found`);
    }
    return user;
  }

  async findOptionalByGoogleId(googleId: string): Promise<User | null> {
    const user =
      await this.usersRepository.findByGoogleIdIncludingDeleted(googleId);
    if (!user) {
      return null;
    }
    return this.restoreIfDeleted(user);
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    Object.assign(user, data);
    const updated = await this.usersRepository.save(user);
    await this.evictCached(id);
    return updated;
  }

  async softDelete(id: string): Promise<void> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    await this.usersRepository.softDelete(id);
    await this.evictCached(id);
  }

  private restoreIfDeleted(user: User): Promise<User> {
    if (!user.deletedAt) {
      return Promise.resolve(user);
    }
    return this.usersRepository.recover(user);
  }

  private userCacheKey(id: string): string {
    return `${USER_CACHE_KEY_PREFIX}${id}`;
  }

  private async getCached(key: string): Promise<User | undefined> {
    try {
      return await this.cache.get<User>(key);
    } catch (err) {
      this.logger.warn(`Cache get failed for key ${key}: ${errorMessage(err)}`);
      return undefined;
    }
  }

  private async setCached(key: string, user: User): Promise<void> {
    try {
      await this.cache.set(key, user);
    } catch (err) {
      this.logger.warn(`Cache set failed for key ${key}: ${errorMessage(err)}`);
    }
  }

  private async evictCached(id: string): Promise<void> {
    const key = this.userCacheKey(id);
    try {
      await this.cache.del(key);
    } catch (err) {
      this.logger.warn(
        `Cache invalidation failed for key ${key}: ${errorMessage(err)}`,
      );
    }
  }
}
