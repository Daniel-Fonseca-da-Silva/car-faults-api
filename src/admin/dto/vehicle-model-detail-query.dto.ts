import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { LookupLocale } from '../../common/enums/lookup-locale.enum';

export class AdminVehicleModelDetailQueryDto {
  @ApiPropertyOptional({ enum: LookupLocale, example: LookupLocale.EnGb })
  @IsOptional()
  @IsEnum(LookupLocale)
  locale?: LookupLocale;
}
