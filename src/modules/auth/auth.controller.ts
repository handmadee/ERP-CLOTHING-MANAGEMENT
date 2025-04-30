import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RegisterDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  RefreshTokenDto,
} from './dto/auth.dto';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { AuthGuard } from './guards/auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtService } from '@nestjs/jwt';
import { Roles } from './decorators/roles.decorator';
// Login note
interface RequestWithUser extends Request {
  user: { userId: string; email: string; role: string };
}

@ApiTags('Authentication')
@Controller('api/auth')
@UseGuards(AuthGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) { }

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @ApiBody({ type: RegisterDto })
  @SwaggerResponse({
    status: 201,
    description: 'Đăng ký thành công',
  })
  @SwaggerResponse({
    status: 400,
    description: 'Dữ liệu không hợp lệ hoặc email đã tồn tại',
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập' })
  @ApiBody({ type: LoginDto })
  @SwaggerResponse({
    status: 200,
    description: 'Đăng nhập thành công',
  })
  @SwaggerResponse({
    status: 401,
    description: 'Thông tin đăng nhập không chính xác',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Yêu cầu khôi phục mật khẩu' })
  @ApiBody({ type: ForgotPasswordDto })
  @SwaggerResponse({
    status: 200,
    description: 'Gửi email khôi phục mật khẩu thành công',
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đặt lại mật khẩu' })
  @ApiBody({ type: ResetPasswordDto })
  @SwaggerResponse({
    status: 200,
    description: 'Đặt lại mật khẩu thành công',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin tài khoản' })
  @SwaggerResponse({
    status: 200,
    description: 'Lấy thông tin thành công',
  })
  @SwaggerResponse({
    status: 401,
    description: 'Không có quyền truy cập',
  })
  async getProfile(@Req() req: RequestWithUser) {
    console.log("🚀 ~ AuthController ~ getProfile ~ req:", req)
    return this.authService.getProfile(req.user.userId);
  }

  @Post('refresh-token')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Làm mới access token' })
  @ApiBody({ type: RefreshTokenDto })
  @SwaggerResponse({
    status: 200,
    description: 'Làm mới token thành công',
  })
  @SwaggerResponse({
    status: 401,
    description: 'Refresh token không hợp lệ hoặc đã hết hạn',
  })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokenWithoutUser(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đăng xuất' })
  @SwaggerResponse({
    status: 200,
    description: 'Đăng xuất thành công',
  })
  async logout(@Req() req: RequestWithUser) {
    return this.authService.logout(req.user.userId);
  }

  @Get('admin-only')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Endpoint chỉ dành cho admin' })
  @SwaggerResponse({
    status: 200,
    description: 'Truy cập thành công',
  })
  @SwaggerResponse({
    status: 403,
    description: 'Không có quyền truy cập',
  })
  adminOnly() {
    return { message: 'You have admin access' };
  }

  @Post('debug/decode-token')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'DEBUG: Giải mã token để kiểm tra (chỉ dùng khi debug)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          description: 'Access token hoặc refresh token cần decode',
        },
      },
    },
  })
  async decodeToken(@Body('token') token: string) {
    try {
      const decoded = this.jwtService.decode(token);
      if (!decoded) {
        return {
          valid: false,
          error: 'Token không hợp lệ hoặc không đúng định dạng',
          decoded: null,
        };
      }
      const currentTime = Math.floor(Date.now() / 1000);
      const isExpired = decoded['exp'] && decoded['exp'] < currentTime;
      return {
        valid: !isExpired,
        error: isExpired ? 'Token đã hết hạn' : null,
        decoded: decoded,
        exp: decoded['exp'] ? new Date(decoded['exp'] * 1000).toISOString() : null,
        iat: decoded['iat'] ? new Date(decoded['iat'] * 1000).toISOString() : null,
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Không thể decode token: ' + error.message,
        decoded: null,
      };
    }
  }

  @Get('debug/check-auth-header')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'DEBUG: Kiểm tra header Authorization (chỉ dùng khi debug)' })
  async checkAuthHeader(@Headers('authorization') authHeader: string) {
    console.log("🚀 ~ AuthController ~ checkAuthHeader ~ authHeader:", authHeader)
    if (!authHeader) {
      return {
        valid: false,
        error: 'Authorization header không tồn tại',
        format: 'Định dạng đúng: "Bearer your_token_here"'
      };
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return {
        valid: false,
        error: 'Authorization header không đúng định dạng',
        format: 'Định dạng đúng: "Bearer your_token_here"',
        received: parts[0],
      };
    }

    const token = parts[1];

    // Mask token for security in logs
    const tokenPreview = token.substring(0, 10) + '...';

    try {
      // Try to decode without verification
      const decoded = this.jwtService.decode(token);

      if (!decoded) {
        return {
          valid: false,
          headerFormat: true,
          error: 'Token không đúng định dạng JWT',
          tokenPreview
        };
      }

      // Check token structure
      const hasRequiredFields = decoded['sub'] && decoded['email'] && decoded['role'];

      return {
        valid: true,
        headerFormat: true,
        tokenFormat: true,
        hasRequiredFields,
        tokenPreview,
        tokenInfo: {
          exp: decoded['exp'] ? new Date(decoded['exp'] * 1000).toISOString() : 'Không có',
          iat: decoded['iat'] ? new Date(decoded['iat'] * 1000).toISOString() : 'Không có',
          sub: decoded['sub'] ? 'Có' : 'Không có',
          email: decoded['email'] ? 'Có' : 'Không có',
          role: decoded['role'] ? 'Có' : 'Không có',
        }
      };
    } catch (error) {
      return {
        valid: false,
        headerFormat: true,
        error: 'Không thể decode token: ' + error.message,
        tokenPreview
      };
    }
  }
}
