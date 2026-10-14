import { LookupLocale } from '../common/enums/lookup-locale.enum';
import {
  LOOKUP_BY_ID_CACHE_KEY_PREFIX,
  LOOKUP_CACHE_KEY_PREFIX,
} from '../redis/redis.constants';
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

/**
 * The by-path lookup resolves the vehicle through the indexed slug columns on
 * every request and caches only the response, keyed by vehicle id. That keeps
 * invalidation exact: the doors fallback and open-ended year ranges mean many
 * different paths can resolve to the same vehicle.
 */
export function buildLookupByIdCacheKey(
  vehicleModelId: string,
  language: LookupLocale,
): string {
  return `${LOOKUP_BY_ID_CACHE_KEY_PREFIX}${vehicleModelId}:${language}`;
}

/**
 * Every cache key that can hold a response for this vehicle model. `lookup`
 * always sends fuelType and language, so its keys carry both; doors is
 * optional. Open-ended ranges (yearTo null) match any later year, so they are
 * expanded up to next year.
 */
export function buildLookupCacheKeysForVehicleModel(
  vehicleModel: VehicleModel,
): string[] {
  const languages = Object.values(LookupLocale);
  const keys = languages.map((language) =>
    buildLookupByIdCacheKey(vehicleModel.id, language),
  );

  if (vehicleModel.fuelType === null) {
    return keys;
  }

  const yearTo =
    vehicleModel.yearTo ??
    Math.max(vehicleModel.yearFrom, new Date().getFullYear() + 1);
  const doorsOptions =
    vehicleModel.doors !== null ? [undefined, vehicleModel.doors] : [undefined];

  for (let year = vehicleModel.yearFrom; year <= yearTo; year++) {
    for (const doors of doorsOptions) {
      for (const language of languages) {
        keys.push(
          buildLookupCacheKey({
            brand: vehicleModel.brand,
            model: vehicleModel.model,
            year,
            engine: vehicleModel.engine,
            doors,
            fuelType: vehicleModel.fuelType,
            language,
          }),
        );
      }
    }
  }

  return keys;
}
