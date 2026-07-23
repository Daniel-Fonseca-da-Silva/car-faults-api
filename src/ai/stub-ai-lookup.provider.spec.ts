import { IssueSeverity } from '../known-issues/enums/issue-severity.enum';
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
      };

      const result = await provider.generateLookup(input);

      expect(result.vehicle).toEqual(input);
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
        doors: 3,
      };

      const result = await provider.generateLookup(input);

      expect(result.vehicle).toEqual(input);
    });
  });
});
