import { Injectable } from '@nestjs/common';
import { IssueSeverity } from '../known-issues/enums/issue-severity.enum';
import {
  AiLookupInput,
  AiLookupProvider,
  AiLookupResult,
} from './ai-lookup.provider';

@Injectable()
export class StubAiLookupProvider implements AiLookupProvider {
  generateLookup(input: AiLookupInput): Promise<AiLookupResult> {
    return Promise.resolve({
      vehicle: {
        brand: input.brand,
        model: input.model,
        year: input.year,
        engine: input.engine,
        ...(input.doors !== undefined ? { doors: input.doors } : {}),
      },
      knownIssues: [
        {
          title: 'Stub known issue',
          description: 'Placeholder issue returned by the stub AI provider.',
          severity: IssueSeverity.MEDIUM,
          fixes: [
            {
              summary: 'Stub fix',
              steps: 'Placeholder steps returned by the stub AI provider.',
            },
          ],
        },
      ],
    });
  }
}
