import { ApiProperty } from '@nestjs/swagger';

export class UploadVehicleImageResponseDto {
  @ApiProperty({
    example: 'https://cdn.example.com/vehicles/b3a5c1d2-4e6f-4a8b.jpg',
  })
  url: string;
}
