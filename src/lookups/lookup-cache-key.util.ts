import { LOOKUP_CACHE_KEY_PREFIX } from '../redis/redis.constants';
import { VehicleModel } from '../vehicle-models/entities/vehicle-model.entity';

export interface LookupCacheKeyCriteria {
  brand: string;
  model: string;
  year: number;
  engine: string;
  doors?: number;
}

export function buildLookupCacheKey(criteria: LookupCacheKeyCriteria): string {
  const doorsSuffix =
    criteria.doors !== undefined ? `:${criteria.doors}` : '';
  return `${LOOKUP_CACHE_KEY_PREFIX}${criteria.brand}:${criteria.model}:${criteria.year}:${criteria.engine}${doorsSuffix}`;
}

export function buildLookupCacheKeysForVehicleModel(
  vehicleModel: VehicleModel,
): string[] {
  const yearTo = vehicleModel.yearTo ?? vehicleModel.yearFrom;
  const keys: string[] = [];

  for (let year = vehicleModel.yearFrom; year <= yearTo; year++) {
    const base = {
      brand: vehicleModel.brand,
      model: vehicleModel.model,
      year,
      engine: vehicleModel.engine,
    };
    keys.push(buildLookupCacheKey(base));
    if (vehicleModel.doors !== null) {
      keys.push(buildLookupCacheKey({ ...base, doors: vehicleModel.doors }));
    }
  }

  return keys;
}
