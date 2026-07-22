import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
  constructor(private readonly usersRepository: UsersRepository) {}

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
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
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
    return this.usersRepository.save(user);
  }

  async softDelete(id: string): Promise<void> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    await this.usersRepository.softDelete(id);
  }

  private restoreIfDeleted(user: User): Promise<User> {
    if (!user.deletedAt) {
      return Promise.resolve(user);
    }
    return this.usersRepository.recover(user);
  }
}
