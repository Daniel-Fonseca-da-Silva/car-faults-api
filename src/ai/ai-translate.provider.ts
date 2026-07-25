import { LookupLocale } from '../common/enums/lookup-locale.enum';
import { IssueSeverity } from '../known-issues/enums/issue-severity.enum';

export const AI_TRANSLATE_PROVIDER = Symbol('AI_TRANSLATE_PROVIDER');

export interface AiTranslateFix {
  summary: string;
  steps: string;
  estimatedCostEur?: number | null;
}

export interface AiTranslateKnownIssue {
  title: string;
  description: string;
  severity: IssueSeverity;
  typicalKm?: number | null;
  sources?: string[] | null;
  fixes: AiTranslateFix[];
}

export interface AiTranslateInput {
  targetLanguage: LookupLocale;
  sourceLanguage: LookupLocale;
  knownIssues: AiTranslateKnownIssue[];
}

export interface AiTranslateResult {
  knownIssues: AiTranslateKnownIssue[];
}

export interface AiTranslateProvider {
  translate(input: AiTranslateInput): Promise<AiTranslateResult>;
}
