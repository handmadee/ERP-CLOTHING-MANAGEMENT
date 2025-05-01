import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Email đăng nhập',
    example: 'user@example.com',
  })
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Mật khẩu đăng nhập',
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
  @ApiProperty({
    description: 'Email của người dùng',
    example: 'user@example.com',
  })
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Mật khẩu của người dùng (tối thiểu 6 ký tự)',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Tên đầy đủ của người dùng',
    example: 'Nguyen Van A',
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  secretCode: string;
}

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email để khôi phục mật khẩu',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ForgotPasswordByAdminDto {
  @ApiProperty({
    description: 'Mật khẩu hiện tại',
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({
    description: 'Mật khẩu mới (tối thiểu 6 ký tự)',
    example: 'newpassword123',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;

  @ApiProperty({
    description: 'Mật khẩu mới (tối thiểu 6 ký tự)',
    example: 'newpassword123',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  confirmPassword: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token khôi phục mật khẩu',
    example: 'reset-token-123',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: 'Mật khẩu mới (tối thiểu 6 ký tự)',
    example: 'newpassword123',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token để lấy access token mới',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class TokenResponseDto {
  @ApiProperty({
    description: 'Access token để xác thực API',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token để lấy access token mới',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;
}

export class UserProfileDto {
  @ApiProperty({
    description: 'ID của người dùng',
    example: '507f1f77bcf86cd799439011',
  })
  id: string;

  @ApiProperty({
    description: 'Email của người dùng',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Tên đầy đủ của người dùng',
    example: 'Nguyen Van A',
  })
  fullName: string;

  @ApiProperty({
    description: 'Vai trò của người dùng',
    example: 'user',
    enum: ['admin', 'user'],
  })
  role: string;
}
