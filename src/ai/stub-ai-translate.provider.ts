import { Injectable } from '@nestjs/common';
import {
  AiTranslateInput,
  AiTranslateProvider,
  AiTranslateResult,
} from './ai-translate.provider';

@Injectable()
export class StubAiTranslateProvider implements AiTranslateProvider {
  translate(input: AiTranslateInput): Promise<AiTranslateResult> {
    const prefix = `[${input.targetLanguage}] `;
    return Promise.resolve({
      knownIssues: input.knownIssues.map((issue) => ({
        ...issue,
        title: `${prefix}${issue.title}`,
        description: `${prefix}${issue.description}`,
        fixes: issue.fixes.map((fix) => ({
          ...fix,
          summary: `${prefix}${fix.summary}`,
          steps: `${prefix}${fix.steps}`,
        })),
      })),
    });
  }
}
