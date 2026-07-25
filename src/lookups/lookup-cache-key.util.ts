import { LookupLocale } from '../common/enums/lookup-locale.enum';
import { LOOKUP_CACHE_KEY_PREFIX } from '../redis/redis.constants';
import { VehicleModel } from '../vehicle-models/entities/vehicle-model.entity';
import { FuelType } from '../vehicle-models/enums/fuel-type.enum';

export interface LookupCacheKeyCriteria {
  brand: string;
  model: string;
  year: number;
  engine: string;
  doors?: number;
  fuelType?: FuelType;
  language?: LookupLocale;
}

export function buildLookupCacheKey(criteria: LookupCacheKeyCriteria): string {
  const doorsSuffix = criteria.doors !== undefined ? `:${criteria.doors}` : '';
  const fuelTypeSuffix =
    criteria.fuelType !== undefined ? `:${criteria.fuelType}` : '';
  const languageSuffix =
    criteria.language !== undefined ? `:${criteria.language}` : '';
  return `${LOOKUP_CACHE_KEY_PREFIX}${criteria.brand}:${criteria.model}:${criteria.year}:${criteria.engine}${doorsSuffix}${fuelTypeSuffix}${languageSuffix}`;
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
    if (vehicleModel.fuelType !== null) {
      keys.push(
        buildLookupCacheKey({ ...base, fuelType: vehicleModel.fuelType }),
      );
    }
    for (const language of Object.values(LookupLocale)) {
      keys.push(buildLookupCacheKey({ ...base, language }));
    }
  }

  return keys;
}
