import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateNotificationsDto {
  @ApiProperty({
    description: 'Enable or disable email notifications',
    example: true,
  })
  @IsBoolean()
  email: boolean;

  @ApiProperty({
    description: 'Enable or disable push notifications',
    example: true,
  })
  @IsBoolean()
  push: boolean;

  @ApiProperty({
    description: 'Enable or disable SMS notifications',
    example: false,
  })
  @IsBoolean()
  sms: boolean;
}
