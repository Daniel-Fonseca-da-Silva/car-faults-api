import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  findById(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  findByGoogleId(googleId: string): Promise<User | null> {
    return this.repository.findOne({ where: { googleId } });
  }

  findByGoogleIdIncludingDeleted(googleId: string): Promise<User | null> {
    return this.repository.findOne({
      where: { googleId },
      withDeleted: true,
    });
  }

  create(data: Partial<User>): User {
    return this.repository.create(data);
  }

  save(user: User): Promise<User> {
    return this.repository.save(user);
  }

  async anonymizeAndSoftDelete(
    id: string,
    anonymizedData: Pick<User, 'name' | 'email' | 'avatarUrl' | 'googleId'>,
  ): Promise<void> {
    await this.repository.update(id, {
      ...anonymizedData,
      deletedAt: new Date(),
    });
  }

  recover(user: User): Promise<User> {
    return this.repository.recover(user);
  }
}
