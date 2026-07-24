import { VehicleModel } from '../vehicle-models/entities/vehicle-model.entity';
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
});

describe('buildLookupCacheKeysForVehicleModel', () => {
  const baseVehicleModel = {
    brand: 'Volkswagen',
    model: 'Polo',
    engine: '1.0',
    doors: null,
  } as VehicleModel;

  it('builds a single-year key when yearTo equals yearFrom', () => {
    const keys = buildLookupCacheKeysForVehicleModel({
      ...baseVehicleModel,
      yearFrom: 2001,
      yearTo: 2001,
    });

    expect(keys).toEqual(['vehicle:lookup:Volkswagen:Polo:2001:1.0']);
  });

  it('treats a null yearTo as a single-year record', () => {
    const keys = buildLookupCacheKeysForVehicleModel({
      ...baseVehicleModel,
      yearFrom: 2001,
      yearTo: null,
    });

    expect(keys).toEqual(['vehicle:lookup:Volkswagen:Polo:2001:1.0']);
  });

  it('builds a key per year in the yearFrom-yearTo range', () => {
    const keys = buildLookupCacheKeysForVehicleModel({
      ...baseVehicleModel,
      yearFrom: 2001,
      yearTo: 2003,
    });

    expect(keys).toEqual([
      'vehicle:lookup:Volkswagen:Polo:2001:1.0',
      'vehicle:lookup:Volkswagen:Polo:2002:1.0',
      'vehicle:lookup:Volkswagen:Polo:2003:1.0',
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
      'vehicle:lookup:Volkswagen:Polo:2002:1.0',
      'vehicle:lookup:Volkswagen:Polo:2002:1.0:3',
    ]);
  });
});
