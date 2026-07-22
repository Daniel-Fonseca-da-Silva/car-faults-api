import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Fix } from './entities/fix.entity';
import { FixesRepository } from './fixes.repository';

@Injectable()
export class FixesService {
  constructor(private readonly fixesRepository: FixesRepository) {}

  saveMany(fixes: Partial<Fix>[], manager: EntityManager): Promise<Fix[]> {
    return this.fixesRepository.saveMany(fixes, manager);
  }
}
