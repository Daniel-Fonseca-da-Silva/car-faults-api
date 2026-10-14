import { LookupLocale } from '../common/enums/lookup-locale.enum';
import { VehicleModel } from '../vehicle-models/entities/vehicle-model.entity';
import { FuelType } from '../vehicle-models/enums/fuel-type.enum';
import {
  buildLookupByIdCacheKey,
  buildLookupCacheKey,
  buildLookupCacheKeysForVehicleModel,
} from './lookup-cache-key.util';

describe('buildLookupCacheKey', () => {
  it('builds a key without doors when doors is not provided', () => {
    const key = buildLookupCacheKey({
      brand: 'Volkswagen',
      model: 'Polo',
      year: 2001,
      engine: '1.0',
    });

    expect(key).toBe('vehicle:lookup:Volkswagen:Polo:2001:1.0');
  });

  it('appends the doors suffix when doors is provided', () => {
    const key = buildLookupCacheKey({
      brand: 'Volkswagen',
      model: 'Polo',
      year: 2001,
      engine: '1.0',
      doors: 3,
    });

    expect(key).toBe('vehicle:lookup:Volkswagen:Polo:2001:1.0:3');
  });

  it('appends the fuelType suffix when fuelType is provided', () => {
    const key = buildLookupCacheKey({
      brand: 'Volkswagen',
      model: 'Polo',
      year: 2001,
      engine: '1.0',
      fuelType: FuelType.DIESEL,
    });

    expect(key).toBe('vehicle:lookup:Volkswagen:Polo:2001:1.0:diesel');
  });

  it('appends the language suffix when language is provided', () => {
    const key = buildLookupCacheKey({
      brand: 'Volkswagen',
      model: 'Polo',
      year: 2001,
      engine: '1.0',
      language: LookupLocale.PtPt,
    });

    expect(key).toBe('vehicle:lookup:Volkswagen:Polo:2001:1.0:pt-PT');
  });

  it('appends doors, fuelType and language suffixes when all are provided', () => {
    const key = buildLookupCacheKey({
      brand: 'Volkswagen',
      model: 'Polo',
      year: 2001,
      engine: '1.0',
      doors: 3,
      fuelType: FuelType.DIESEL,
      language: LookupLocale.PtPt,
    });

    expect(key).toBe('vehicle:lookup:Volkswagen:Polo:2001:1.0:3:diesel:pt-PT');
  });
});

describe('buildLookupByIdCacheKey', () => {
  it('builds a key from the vehicle model id and language', () => {
    expect(buildLookupByIdCacheKey('vm-1', LookupLocale.PtBr)).toBe(
      'vehicle:lookup-by-id:vm-1:pt-BR',
    );
  });
});

describe('buildLookupCacheKeysForVehicleModel', () => {
  const baseVehicleModel = {
    id: 'vm-1',
    brand: 'Volkswagen',
    model: 'Polo',
    engine: '1.0',
    doors: null,
    fuelType: FuelType.DIESEL,
  } as VehicleModel;

  const languages = Object.values(LookupLocale);
  const byIdKeys = languages.map(
    (language) => `vehicle:lookup-by-id:vm-1:${language}`,
  );
  const lookupKeys = (base: string) =>
    languages.map((language) => `${base}:${language}`);

  afterEach(() => {
    jest.useRealTimers();
  });

  it('builds the by-id keys plus a fuelType+language key per supported language for a single year', () => {
    const keys = buildLookupCacheKeysForVehicleModel({
      ...baseVehicleModel,
      yearFrom: 2001,
      yearTo: 2001,
    });

    expect(keys).toEqual([
      ...byIdKeys,
      ...lookupKeys('vehicle:lookup:Volkswagen:Polo:2001:1.0:diesel'),
    ]);
  });

  it('matches the key lookup() writes for the same vehicle', () => {
    const keys = buildLookupCacheKeysForVehicleModel({
      ...baseVehicleModel,
      yearFrom: 2001,
      yearTo: 2001,
    });

    expect(keys).toContain(
      buildLookupCacheKey({
        brand: 'Volkswagen',
        model: 'Polo',
        year: 2001,
        engine: '1.0',
        fuelType: FuelType.DIESEL,
        language: LookupLocale.PtPt,
      }),
    );
  });

  it('builds keys per year in the yearFrom-yearTo range', () => {
    const keys = buildLookupCacheKeysForVehicleModel({
      ...baseVehicleModel,
      yearFrom: 2001,
      yearTo: 2002,
    });

    expect(keys).toEqual([
      ...byIdKeys,
      ...lookupKeys('vehicle:lookup:Volkswagen:Polo:2001:1.0:diesel'),
      ...lookupKeys('vehicle:lookup:Volkswagen:Polo:2002:1.0:diesel'),
    ]);
  });

  it('expands an open-ended range (null yearTo) up to next year', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-01T00:00:00Z'));

    const keys = buildLookupCacheKeysForVehicleModel({
      ...baseVehicleModel,
      yearFrom: 2025,
      yearTo: null,
    });

    expect(keys).toEqual([
      ...byIdKeys,
      ...lookupKeys('vehicle:lookup:Volkswagen:Polo:2025:1.0:diesel'),
      ...lookupKeys('vehicle:lookup:Volkswagen:Polo:2026:1.0:diesel'),
      ...lookupKeys('vehicle:lookup:Volkswagen:Polo:2027:1.0:diesel'),
    ]);
  });

  it('adds doors variants alongside the doors-less keys when doors is set', () => {
    const keys = buildLookupCacheKeysForVehicleModel({
      ...baseVehicleModel,
      yearFrom: 2001,
      yearTo: 2001,
      doors: 3,
    });

    expect(keys).toEqual([
      ...byIdKeys,
      ...lookupKeys('vehicle:lookup:Volkswagen:Polo:2001:1.0:diesel'),
      ...lookupKeys('vehicle:lookup:Volkswagen:Polo:2001:1.0:3:diesel'),
    ]);
  });

  it('returns only the by-id keys when fuelType is null, since lookup() always sends one', () => {
    const keys = buildLookupCacheKeysForVehicleModel({
      ...baseVehicleModel,
      yearFrom: 2001,
      yearTo: 2001,
      fuelType: null,
    });

    expect(keys).toEqual(byIdKeys);
  });
});
