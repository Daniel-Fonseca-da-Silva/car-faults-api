import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { LookupLocale } from '../../common/enums/lookup-locale.enum';

export class UserVehiclesQueryDto {
  @ApiPropertyOptional({
    description: 'Optional. Defaults to en-GB when omitted.',
    enum: LookupLocale,
    example: LookupLocale.EnGb,
  })
  @IsOptional()
  @IsEnum(LookupLocale)
  language?: LookupLocale;
}
