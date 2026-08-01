import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { LookupLocale } from '../common/enums/lookup-locale.enum';
import { KnownIssue } from '../known-issues/entities/known-issue.entity';
import { KnownIssuesService } from '../known-issues/known-issues.service';
import { errorMessage } from '../redis/redis-error.util';
import { userStatsCacheKey } from '../redis/redis.constants';
import { VehicleModelsService } from '../vehicle-models/vehicle-models.service';
import { UserVehicle } from './entities/user-vehicle.entity';
import { UserVehiclesRepository } from './user-vehicles.repository';

export interface CreateUserVehicleData {
  vehicleModelId?: string;
  brand?: string;
  model?: string;
  year: number;
  engine?: string;
  name?: string;
  doors?: number;
}

export interface UpdateUserVehicleData {
  vehicleModelId?: string;
  brand?: string;
  model?: string;
  year?: number;
  engine?: string;
  name?: string;
  doors?: number;
}

interface CatalogLink {
  vehicleModelId: string;
  brand: string;
  model: string;
  engine: string;
  doors: number | null;
}

interface LookupLink {
  vehicleModelId: string | null;
  brand: string;
  model: string;
  engine: string;
}

@Injectable()
export class UserVehiclesService {
  private readonly logger = new Logger(UserVehiclesService.name);

  constructor(
    private readonly userVehiclesRepository: UserVehiclesRepository,
    private readonly vehicleModelsService: VehicleModelsService,
    private readonly knownIssuesService: KnownIssuesService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  findAllByUser(userId: string): Promise<UserVehicle[]> {
    return this.userVehiclesRepository.findAllByUserId(userId);
  }

  async findAllByUserWithIssueCounts(
    userId: string,
    locale: LookupLocale = LookupLocale.EnGb,
  ): Promise<Array<{ userVehicle: UserVehicle; knownIssuesCount: number }>> {
    const userVehicles = await this.findAllByUser(userId);
    return Promise.all(
      userVehicles.map(async (userVehicle) => ({
        userVehicle,
        knownIssuesCount: await this.countKnownIssues(userVehicle, locale),
      })),
    );
  }

  countKnownIssues(
    userVehicle: UserVehicle,
    locale: LookupLocale = LookupLocale.EnGb,
  ): Promise<number> {
    return userVehicle.vehicleModelId
      ? this.knownIssuesService.countByVehicleModelIdAndLocale(
          userVehicle.vehicleModelId,
          locale,
        )
      : Promise.resolve(0);
  }

  countByUser(userId: string): Promise<number> {
    return this.userVehiclesRepository.countByUserId(userId);
  }

  findOneByUser(id: string, userId: string): Promise<UserVehicle> {
    return this.getOwned(id, userId);
  }

  findKnownIssues(
    userVehicle: UserVehicle,
    locale: LookupLocale = LookupLocale.EnGb,
  ): Promise<KnownIssue[]> {
    if (!userVehicle.vehicleModelId) {
      return Promise.resolve([]);
    }
    return this.knownIssuesService.findByVehicleModelIdAndLocale(
      userVehicle.vehicleModelId,
      locale,
    );
  }

  async create(
    userId: string,
    data: CreateUserVehicleData,
  ): Promise<UserVehicle> {
    let link: CatalogLink | LookupLink;
    let doors: number | null;

    if (data.vehicleModelId) {
      const catalogLink = await this.resolveFromCatalog(data.vehicleModelId);
      link = catalogLink;
      doors = catalogLink.doors;
    } else {
      link = await this.resolveFromLookup({
        brand: data.brand,
        model: data.model,
        year: data.year,
        engine: data.engine,
      });
      doors = data.doors ?? null;
    }

    await this.assertUnique({
      userId,
      brand: link.brand,
      model: link.model,
      year: data.year,
      engine: link.engine,
    });

    const userVehicle = this.userVehiclesRepository.create({
      userId,
      vehicleModelId: link.vehicleModelId,
      brand: link.brand,
      model: link.model,
      year: data.year,
      engine: link.engine,
      doors,
      name: data.name ?? null,
    });
    const saved = await this.userVehiclesRepository.save(userVehicle);
    await this.evictStatsCache(userId);
    return saved;
  }

  async update(
    id: string,
    userId: string,
    data: UpdateUserVehicleData,
  ): Promise<UserVehicle> {
    const userVehicle = await this.getOwned(id, userId);

    if (data.name !== undefined) {
      userVehicle.name = data.name;
    }

    let brand = userVehicle.brand;
    let model = userVehicle.model;
    let year = userVehicle.year;
    let engine = userVehicle.engine;
    let vehicleModelId = userVehicle.vehicleModelId;
    let doors = data.doors !== undefined ? data.doors : userVehicle.doors;

    const lookupChanged =
      data.vehicleModelId !== undefined ||
      data.brand !== undefined ||
      data.model !== undefined ||
      data.year !== undefined ||
      data.engine !== undefined;

    if (lookupChanged) {
      if (data.vehicleModelId !== undefined) {
        const link = await this.resolveFromCatalog(data.vehicleModelId);
        brand = link.brand;
        model = link.model;
        engine = link.engine;
        doors = link.doors;
        vehicleModelId = link.vehicleModelId;
        year = data.year ?? year;
      } else {
        brand = data.brand ?? brand;
        model = data.model ?? model;
        engine = data.engine ?? engine;
        year = data.year ?? year;
        const link = await this.resolveFromLookup({
          brand,
          model,
          year,
          engine,
        });
        vehicleModelId = link.vehicleModelId;
      }

      await this.assertUnique(
        { userId, brand, model, year, engine },
        userVehicle.id,
      );
    }

    userVehicle.brand = brand;
    userVehicle.model = model;
    userVehicle.year = year;
    userVehicle.engine = engine;
    userVehicle.vehicleModelId = vehicleModelId;
    userVehicle.doors = doors;

    return this.userVehiclesRepository.save(userVehicle);
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.getOwned(id, userId);
    await this.userVehiclesRepository.softDelete(id);
    await this.evictStatsCache(userId);
  }

  private async evictStatsCache(userId: string): Promise<void> {
    const key = userStatsCacheKey(userId);
    try {
      await this.cache.del(key);
    } catch (err) {
      this.logger.warn(
        `Cache invalidation failed for key ${key}: ${errorMessage(err)}`,
      );
    }
  }

  private async getOwned(id: string, userId: string): Promise<UserVehicle> {
    const userVehicle = await this.userVehiclesRepository.findById(id);
    if (!userVehicle || userVehicle.userId !== userId) {
      throw new NotFoundException(`User vehicle ${id} not found`);
    }
    return userVehicle;
  }

  private async assertUnique(
    key: {
      userId: string;
      brand: string;
      model: string;
      year: number;
      engine: string;
    },
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.userVehiclesRepository.findByUniqueKey(
      key,
      excludeId,
    );
    if (existing) {
      throw new ConflictException('This vehicle is already in your garage');
    }
  }

  private async resolveFromCatalog(
    vehicleModelId: string,
  ): Promise<CatalogLink> {
    const vehicleModel =
      await this.vehicleModelsService.findById(vehicleModelId);
    if (!vehicleModel) {
      throw new NotFoundException(`Vehicle model ${vehicleModelId} not found`);
    }
    return {
      vehicleModelId: vehicleModel.id,
      brand: vehicleModel.brand,
      model: vehicleModel.model,
      engine: vehicleModel.engine,
      doors: vehicleModel.doors,
    };
  }

  private async resolveFromLookup(criteria: {
    brand?: string;
    model?: string;
    year: number;
    engine?: string;
  }): Promise<LookupLink> {
    const brand = criteria.brand as string;
    const model = criteria.model as string;
    const engine = criteria.engine as string;

    const match = await this.vehicleModelsService.findByLookup({
      brand,
      model,
      year: criteria.year,
      engine,
    });

    return {
      vehicleModelId: match?.id ?? null,
      brand,
      model,
      engine,
    };
  }
}
