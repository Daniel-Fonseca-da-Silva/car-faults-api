import { LookupLocale } from '../common/enums/lookup-locale.enum';
import { IssueSeverity } from '../known-issues/enums/issue-severity.enum';
import { AiTranslateInput } from './ai-translate.provider';
import { StubAiTranslateProvider } from './stub-ai-translate.provider';

describe('StubAiTranslateProvider', () => {
  let provider: StubAiTranslateProvider;

  beforeEach(() => {
    provider = new StubAiTranslateProvider();
  });

  it('prefixes translated title, description, summary and steps with the target language', async () => {
    const input: AiTranslateInput = {
      sourceLanguage: LookupLocale.EnGb,
      targetLanguage: LookupLocale.PtPt,
      knownIssues: [
        {
          title: 'Gearbox',
          description: 'Wears out',
          severity: IssueSeverity.HIGH,
          typicalKm: 120000,
          sources: ['https://example.com'],
          fixes: [
            {
              summary: 'Replace synchros',
              steps: 'Do it',
              estimatedCostEur: 450,
            },
          ],
        },
      ],
    };

    const result = await provider.translate(input);

    expect(result.knownIssues).toEqual([
      {
        title: '[pt-PT] Gearbox',
        description: '[pt-PT] Wears out',
        severity: IssueSeverity.HIGH,
        typicalKm: 120000,
        sources: ['https://example.com'],
        fixes: [
          {
            summary: '[pt-PT] Replace synchros',
            steps: '[pt-PT] Do it',
            estimatedCostEur: 450,
          },
        ],
      },
    ]);
  });

  it('preserves severity, typicalKm, sources and estimatedCostEur unchanged', async () => {
    const input: AiTranslateInput = {
      sourceLanguage: LookupLocale.PtPt,
      targetLanguage: LookupLocale.EnGb,
      knownIssues: [
        {
          title: 'Caixa de velocidades',
          description: 'Desgasta-se',
          severity: IssueSeverity.MEDIUM,
          fixes: [],
        },
      ],
    };

    const result = await provider.translate(input);

    expect(result.knownIssues[0].severity).toBe(IssueSeverity.MEDIUM);
    expect(result.knownIssues[0].typicalKm).toBeUndefined();
    expect(result.knownIssues[0].fixes).toEqual([]);
  });
});
