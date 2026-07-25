import { LookupLocale } from '../common/enums/lookup-locale.enum';
import { IssueSeverity } from '../known-issues/enums/issue-severity.enum';
import { FuelType } from '../vehicle-models/enums/fuel-type.enum';
import { StubAiLookupProvider } from './stub-ai-lookup.provider';

describe('StubAiLookupProvider', () => {
  let provider: StubAiLookupProvider;

  beforeEach(() => {
    provider = new StubAiLookupProvider();
  });

  describe('generateLookup', () => {
    it('returns a deterministic result echoing the input vehicle', async () => {
      const input = {
        brand: 'Volkswagen',
        model: 'Polo',
        year: 2001,
        engine: '1.0',
        fuelType: FuelType.DIESEL,
        language: LookupLocale.EnGb,
      };

      const result = await provider.generateLookup(input);

      expect(result.vehicle).toEqual({
        brand: input.brand,
        model: input.model,
        year: input.year,
        engine: input.engine,
        fuelType: input.fuelType,
        name: 'Volkswagen Polo',
      });
      expect(result.knownIssues).toHaveLength(1);
      expect(result.knownIssues[0].severity).toBe(IssueSeverity.MEDIUM);
      expect(result.knownIssues[0].fixes).toHaveLength(1);
    });

    it('echoes doors when present in the input', async () => {
      const input = {
        brand: 'Volkswagen',
        model: 'Polo',
        year: 2001,
        engine: '1.0',
        fuelType: FuelType.DIESEL,
        language: LookupLocale.EnGb,
        doors: 3,
      };

      const result = await provider.generateLookup(input);

      expect(result.vehicle).toEqual({
        brand: input.brand,
        model: input.model,
        year: input.year,
        engine: input.engine,
        fuelType: input.fuelType,
        doors: input.doors,
        name: 'Volkswagen Polo',
      });
    });

    it('derives name from brand and model', async () => {
      const input = {
        brand: 'Renault',
        model: 'Clio',
        year: 2005,
        engine: '1.2',
        fuelType: FuelType.GASOLINE,
        language: LookupLocale.EnGb,
      };

      const result = await provider.generateLookup(input);

      expect(result.vehicle.name).toBe('Renault Clio');
    });

    it('echoes fuelType from the input', async () => {
      const input = {
        brand: 'Volkswagen',
        model: 'Polo',
        year: 2001,
        engine: '1.0',
        fuelType: FuelType.ELECTRIC,
        language: LookupLocale.EnGb,
      };

      const result = await provider.generateLookup(input);

      expect(result.vehicle.fuelType).toBe(FuelType.ELECTRIC);
    });
  });
});
