import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LookupQueryDto } from './dto/lookup-query.dto';
import { LookupResponseDto } from './dto/lookup-response.dto';
import { LookupsService } from './lookups.service';

@ApiTags('lookups')
@Controller('lookups')
export class LookupsController {
  constructor(private readonly lookupsService: LookupsService) {}

  @Get()
  @ApiOperation({
    summary: 'Look up known issues and tech specs for a vehicle',
  })
  @ApiOkResponse({ type: LookupResponseDto })
  lookup(@Query() query: LookupQueryDto): Promise<LookupResponseDto> {
    return this.lookupsService.lookup(query);
  }
}
