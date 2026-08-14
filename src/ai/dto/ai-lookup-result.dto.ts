import { ServiceUnavailableException } from '@nestjs/common';
import { plainToInstance, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  validate,
  ValidateNested,
} from 'class-validator';
import { IssueSeverity } from '../../known-issues/enums/issue-severity.enum';
import { FuelType } from '../../vehicle-models/enums/fuel-type.enum';
import { AiLookupResult } from '../ai-lookup.provider';

class AiFixResultDto {
  @IsString()
  summary: string;

  @IsString()
  steps: string;

  @IsOptional()
  @IsNumber()
  estimatedCostEur?: number;
}

class AiKnownIssueResultDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(IssueSeverity)
  severity: IssueSeverity;

  @IsOptional()
  @IsInt()
  typicalKm?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  sources?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AiFixResultDto)
  fixes: AiFixResultDto[];
}

class AiVehicleResultDto {
  @IsString()
  brand: string;

  @IsString()
  model: string;

  @IsString()
  name: string;

  @IsInt()
  year: number;

  @IsString()
  engine: string;

  @IsOptional()
  @IsInt()
  doors?: number;

  @IsOptional()
  @IsEnum(FuelType)
  fuelType?: FuelType;

  @IsOptional()
  @IsObject()
  techSpecs?: Record<string, unknown>;
}

class AiLookupResultDto {
  @ValidateNested()
  @Type(() => AiVehicleResultDto)
  vehicle: AiVehicleResultDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AiKnownIssueResultDto)
  knownIssues: AiKnownIssueResultDto[];
}

export async function parseAiLookupResult(
  payload: unknown,
): Promise<AiLookupResult> {
  const instance = plainToInstance(AiLookupResultDto, payload);

  const errors = await validate(instance, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  if (errors.length > 0) {
    throw new ServiceUnavailableException(
      'AI provider returned an invalid lookup response',
    );
  }

  return instance;
}
