import { ServiceUnavailableException } from '@nestjs/common';
import { plainToInstance, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  validate,
  ValidateNested,
} from 'class-validator';
import { IssueSeverity } from '../../known-issues/enums/issue-severity.enum';
import { AiTranslateResult } from '../ai-translate.provider';

class AiTranslateFixDto {
  @IsString()
  summary: string;

  @IsString()
  steps: string;

  @IsOptional()
  @IsNumber()
  estimatedCostEur?: number | null;
}

class AiTranslateKnownIssueDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(IssueSeverity)
  severity: IssueSeverity;

  @IsOptional()
  @IsInt()
  typicalKm?: number | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sources?: string[] | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AiTranslateFixDto)
  fixes: AiTranslateFixDto[];
}

class AiTranslateResultDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AiTranslateKnownIssueDto)
  knownIssues: AiTranslateKnownIssueDto[];
}

export async function parseAiTranslateResult(
  payload: unknown,
): Promise<AiTranslateResult> {
  const instance = plainToInstance(AiTranslateResultDto, payload);

  const errors = await validate(instance, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  if (errors.length > 0) {
    throw new ServiceUnavailableException(
      'AI provider returned an invalid translate response',
    );
  }

  return instance;
}
