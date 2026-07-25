import { LookupLocale } from '../common/enums/lookup-locale.enum';
import { IssueSeverity } from '../known-issues/enums/issue-severity.enum';
import { FuelType } from '../vehicle-models/enums/fuel-type.enum';

export const AI_LOOKUP_PROVIDER = Symbol('AI_LOOKUP_PROVIDER');

export interface AiLookupInput {
  brand: string;
  model: string;
  year: number;
  engine: string;
  doors?: number;
  fuelType: FuelType;
  language: LookupLocale;
}

export interface AiFixResult {
  summary: string;
  steps: string;
  estimatedCostEur?: number;
}

export interface AiKnownIssueResult {
  title: string;
  description: string;
  severity: IssueSeverity;
  typicalKm?: number;
  sources?: string[];
  fixes: AiFixResult[];
}

export interface AiVehicleResult {
  brand: string;
  model: string;
  name: string;
  year: number;
  engine: string;
  doors?: number;
  fuelType?: FuelType;
  techSpecs?: Record<string, unknown>;
}

export interface AiLookupResult {
  vehicle: AiVehicleResult;
  knownIssues: AiKnownIssueResult[];
}

export interface AiLookupProvider {
  generateLookup(input: AiLookupInput): Promise<AiLookupResult>;
}
