import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRegistrationSecretDto {
  @ApiProperty({
    description:
      'The registration secret code required for new user registration',
    example: 'SECRET123',
  })
  @IsString()
  @IsNotEmpty()
  registrationSecret: string;
}
