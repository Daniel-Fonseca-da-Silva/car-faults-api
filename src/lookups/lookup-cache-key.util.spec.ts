import { LookupLocale } from '../common/enums/lookup-locale.enum';
import { VehicleModel } from '../vehicle-models/entities/vehicle-model.entity';
import { FuelType } from '../vehicle-models/enums/fuel-type.enum';
import {
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

describe('buildLookupCacheKeysForVehicleModel', () => {
  const baseVehicleModel = {
    brand: 'Volkswagen',
    model: 'Polo',
    engine: '1.0',
    doors: null,
    fuelType: null,
  } as VehicleModel;

  it('builds a single-year key plus a variant per supported language when yearTo equals yearFrom', () => {
    const keys = buildLookupCacheKeysForVehicleModel({
      ...baseVehicleModel,
      yearFrom: 2001,
      yearTo: 2001,
    });

    expect(keys).toEqual([
      'vehicle:lookup:Volkswagen:Polo:2001:1.0',
      'vehicle:lookup:Volkswagen:Polo:2001:1.0:pt-PT',
      'vehicle:lookup:Volkswagen:Polo:2001:1.0:en-GB',
      'vehicle:lookup:Volkswagen:Polo:2001:1.0:es-ES',
    ]);
  });

  it('treats a null yearTo as a single-year record', () => {
    const keys = buildLookupCacheKeysForVehicleModel({
      ...baseVehicleModel,
      yearFrom: 2001,
      yearTo: null,
    });

    expect(keys).toEqual([
      'vehicle:lookup:Volkswagen:Polo:2001:1.0',
      'vehicle:lookup:Volkswagen:Polo:2001:1.0:pt-PT',
      'vehicle:lookup:Volkswagen:Polo:2001:1.0:en-GB',
      'vehicle:lookup:Volkswagen:Polo:2001:1.0:es-ES',
    ]);
  });

  it('builds a key per year in the yearFrom-yearTo range', () => {
    const keys = buildLookupCacheKeysForVehicleModel({
      ...baseVehicleModel,
      yearFrom: 2001,
      yearTo: 2003,
    });

    expect(keys).toEqual([
      'vehicle:lookup:Volkswagen:Polo:2001:1.0',
      'vehicle:lookup:Volkswagen:Polo:2001:1.0:pt-PT',
      'vehicle:lookup:Volkswagen:Polo:2001:1.0:en-GB',
      'vehicle:lookup:Volkswagen:Polo:2001:1.0:es-ES',
      'vehicle:lookup:Volkswagen:Polo:2002:1.0',
      'vehicle:lookup:Volkswagen:Polo:2002:1.0:pt-PT',
      'vehicle:lookup:Volkswagen:Polo:2002:1.0:en-GB',
      'vehicle:lookup:Volkswagen:Polo:2002:1.0:es-ES',
      'vehicle:lookup:Volkswagen:Polo:2003:1.0',
      'vehicle:lookup:Volkswagen:Polo:2003:1.0:pt-PT',
      'vehicle:lookup:Volkswagen:Polo:2003:1.0:en-GB',
      'vehicle:lookup:Volkswagen:Polo:2003:1.0:es-ES',
    ]);
  });

  it('adds a doors variant per year when doors is set', () => {
    const keys = buildLookupCacheKeysForVehicleModel({
      ...baseVehicleModel,
      yearFrom: 2001,
      yearTo: 2002,
      doors: 3,
    });

    expect(keys).toEqual([
      'vehicle:lookup:Volkswagen:Polo:2001:1.0',
      'vehicle:lookup:Volkswagen:Polo:2001:1.0:3',
      'vehicle:lookup:Volkswagen:Polo:2001:1.0:pt-PT',
      'vehicle:lookup:Volkswagen:Polo:2001:1.0:en-GB',
      'vehicle:lookup:Volkswagen:Polo:2001:1.0:es-ES',
      'vehicle:lookup:Volkswagen:Polo:2002:1.0',
      'vehicle:lookup:Volkswagen:Polo:2002:1.0:3',
      'vehicle:lookup:Volkswagen:Polo:2002:1.0:pt-PT',
      'vehicle:lookup:Volkswagen:Polo:2002:1.0:en-GB',
      'vehicle:lookup:Volkswagen:Polo:2002:1.0:es-ES',
    ]);
  });

  it('adds a fuelType variant per year when fuelType is set', () => {
    const keys = buildLookupCacheKeysForVehicleModel({
      ...baseVehicleModel,
      yearFrom: 2001,
      yearTo: 2002,
      fuelType: FuelType.DIESEL,
    });

    expect(keys).toEqual([
      'vehicle:lookup:Volkswagen:Polo:2001:1.0',
      'vehicle:lookup:Volkswagen:Polo:2001:1.0:diesel',
      'vehicle:lookup:Volkswagen:Polo:2001:1.0:pt-PT',
      'vehicle:lookup:Volkswagen:Polo:2001:1.0:en-GB',
      'vehicle:lookup:Volkswagen:Polo:2001:1.0:es-ES',
      'vehicle:lookup:Volkswagen:Polo:2002:1.0',
      'vehicle:lookup:Volkswagen:Polo:2002:1.0:diesel',
      'vehicle:lookup:Volkswagen:Polo:2002:1.0:pt-PT',
      'vehicle:lookup:Volkswagen:Polo:2002:1.0:en-GB',
      'vehicle:lookup:Volkswagen:Polo:2002:1.0:es-ES',
    ]);
  });

  it('adds doors, fuelType, then language variants per year when all are set', () => {
    const keys = buildLookupCacheKeysForVehicleModel({
      ...baseVehicleModel,
      yearFrom: 2001,
      yearTo: 2001,
      doors: 3,
      fuelType: FuelType.DIESEL,
    });

    expect(keys).toEqual([
      'vehicle:lookup:Volkswagen:Polo:2001:1.0',
      'vehicle:lookup:Volkswagen:Polo:2001:1.0:3',
      'vehicle:lookup:Volkswagen:Polo:2001:1.0:diesel',
      'vehicle:lookup:Volkswagen:Polo:2001:1.0:pt-PT',
      'vehicle:lookup:Volkswagen:Polo:2001:1.0:en-GB',
      'vehicle:lookup:Volkswagen:Polo:2001:1.0:es-ES',
    ]);
  });
});
