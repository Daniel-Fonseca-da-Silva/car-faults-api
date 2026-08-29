import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { LookupLocale } from '../../common/enums/lookup-locale.enum';
import { CursorPaginationQueryDto } from '../../common/pagination/cursor-query.dto';

export const GARAGE_DEFAULT_LIMIT = 20;
export const GARAGE_MAX_LIMIT = 100;

export class UserVehiclesQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Optional. Defaults to en-GB when omitted.',
    enum: LookupLocale,
    example: LookupLocale.EnGb,
  })
  @IsOptional()
  @IsEnum(LookupLocale)
  language?: LookupLocale;
}
