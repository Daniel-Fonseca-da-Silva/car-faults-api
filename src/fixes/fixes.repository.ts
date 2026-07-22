import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Fix } from './entities/fix.entity';

@Injectable()
export class FixesRepository {
  saveMany(fixes: Partial<Fix>[], manager: EntityManager): Promise<Fix[]> {
    return manager.getRepository(Fix).save(fixes);
  }
}
