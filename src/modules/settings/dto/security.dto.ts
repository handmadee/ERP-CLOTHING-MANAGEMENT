import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSecurityDto {
  @ApiProperty({
    description: 'Enable or disable two-factor authentication',
    example: false,
  })
  @IsBoolean()
  twoFactorEnabled: boolean;
}
