import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { Account, AccountDocument } from './models/account.model';
import {
  LoginDto,
  RegisterDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ForgotPasswordByAdminDto,
} from './dto/auth.dto';
import { Role } from '../../common/enums/role.enum';
import { SettingsService } from '../settings/settings.service';
import { Logger } from '@nestjs/common';
import { ApiResponse } from 'src/common/dto/api-response.dto';
import { MESSAGES } from '../../common/constants/index';



export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: Role;
    isEmailVerified: boolean;
    lastLogin: Date;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(Account.name) private accountModel: Model<AccountDocument>,
    @InjectConnection() private connection: Connection,
    private jwtService: JwtService,
    private configService: ConfigService,
    private settingsService: SettingsService,
  ) { }

  async validateAccount(
    email: string,
    password: string,
  ): Promise<AccountDocument | null> {
    const account = await this.accountModel.findOne({ email, isActive: true });
    if (account && (await bcrypt.compare(password, account.password))) {
      return account;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const account = await this.validateAccount(
        loginDto.email,
        loginDto.password,
      );
      console.log("🚀 ~ AuthService ~ login ~ account:", account)
      if (!account) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const tokens = await this.generateTokens(account);
      await this.accountModel
        .updateOne(
          { _id: account._id },
          {
            lastLogin: new Date(),
            refreshToken: tokens.refreshToken,
          },
        )
        .session(session);

      await session.commitTransaction();

      return {
        ...tokens,
        user: {
          id: account.id,
          email: account.email,
          fullName: account.fullName,
          role: account.role,
          isEmailVerified: account.isEmailVerified,
          lastLogin: account.lastLogin,
        },
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async register(registerDto: RegisterDto) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const settings = await this.settingsService.getSettings();
      if (
        !settings.registrationSecret ||
        settings.registrationSecret !== registerDto.secretCode
      ) {
        throw new BadRequestException(MESSAGES.AUTH.INVALID_CREDENTIALS);
      }

      const existingAccount = await this.accountModel
        .findOne({ email: registerDto.email })
        .session(session);

      if (existingAccount) {
        throw new BadRequestException('Email already registered');
      }

      const hashedPassword = await bcrypt.hash(registerDto.password, 10);
      const newAccount = await this.accountModel.create(
        [
          {
            ...registerDto,
            password: hashedPassword,
            role: Role.ADMIN,
            isActive: true,
            isEmailVerified: false,
          },
        ],
        { session },
      );

      const tokens = await this.generateTokens(newAccount[0]);
      await this.accountModel
        .updateOne(
          { _id: newAccount[0]._id },
          { refreshToken: tokens.refreshToken },
        )
        .session(session);

      await session.commitTransaction();

      return {
        ...tokens,
        user: {
          id: newAccount[0].id,
          email: newAccount[0].email,
          fullName: newAccount[0].fullName,
          role: newAccount[0].role,
          isEmailVerified: newAccount[0].isEmailVerified,
          lastLogin: newAccount[0].lastLogin,
        },
      };
    } catch (error) {
      await session.abortTransaction();
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error during registration');
    } finally {
      session.endSession();
    }
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const account = await this.accountModel
        .findOne({
          email: forgotPasswordDto.email,
          isActive: true,
        })
        .session(session);

      if (!account) {
        throw new BadRequestException('Account not found');
      }

      const resetToken = uuidv4();
      const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await this.accountModel
        .updateOne(
          { _id: account._id },
          {
            passwordResetToken: resetToken,
            passwordResetExpires: resetTokenExpiry,
          },
        )
        .session(session);

      await session.commitTransaction();
      // TODO: Send email with reset token
      return { message: 'Password reset instructions sent to email' };
    } catch (error) {
      await session.abortTransaction();
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error during forgot password process',
      );
    } finally {
      session.endSession();
    }
  }

  async ForgotPasswordByAdmin(
    userId: string,
    forgotPasswordDto: ForgotPasswordByAdminDto,
  ) {
    console.log("🚀 ~ AuthService ~ forgotPasswordDto:", forgotPasswordDto)
    const session = await this.connection.startSession();
    try {
      session.startTransaction();
      const account = await this.accountModel.findOne({ _id: userId, isActive: true }).session(session);
      if (!account) {
        throw new BadRequestException('Tài khoản không tồn tại');
      }
      const isPasswordCorrect = await bcrypt.compare(forgotPasswordDto.currentPassword, account.password);
      if (!isPasswordCorrect) {
        throw new BadRequestException('Mật khẩu hiện tại không chính xác');
      }
      if (forgotPasswordDto.newPassword !== forgotPasswordDto.confirmPassword) {
        throw new BadRequestException('Mật khẩu mới và xác nhận mật khẩu không khớp');
      }
      const hashedPassword = await bcrypt.hash(forgotPasswordDto.newPassword, 10);
      await this.accountModel.updateOne({ _id: userId }, { password: hashedPassword }).session(session);
      await session.commitTransaction();
      return { message: 'Mật khẩu đã được đặt lại thành công' };
    } catch (error) {
      await session.abortTransaction();
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Error during password reset');
    } finally {
      session.endSession();
    }
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const account = await this.accountModel
        .findOne({
          passwordResetToken: resetPasswordDto.token,
          passwordResetExpires: { $gt: new Date() },
          isActive: true,
        })
        .session(session);

      if (!account) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      const hashedPassword = await bcrypt.hash(
        resetPasswordDto.newPassword,
        10,
      );

      await this.accountModel
        .updateOne(
          { _id: account._id },
          {
            password: hashedPassword,
            passwordResetToken: null,
            passwordResetExpires: null,
            refreshToken: null,
          },
        )
        .session(session);

      await session.commitTransaction();
      return { message: 'Password successfully reset' };
    } catch (error) {
      await session.abortTransaction();
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Error during password reset');
    } finally {
      session.endSession();
    }
  }

  async refreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const account = await this.accountModel
        .findOne({
          _id: userId,
          refreshToken,
          isActive: true,
        })
        .session(session);

      if (!account) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(account);
      await this.accountModel
        .updateOne({ _id: account._id }, { refreshToken: tokens.refreshToken })
        .session(session);

      await session.commitTransaction();
      return tokens;
    } catch (error) {
      await session.abortTransaction();
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Error during token refresh');
    } finally {
      session.endSession();
    }
  }

  async logout(userId: string): Promise<{ message: string }> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      await this.accountModel
        .updateOne({ _id: userId }, { refreshToken: null })
        .session(session);

      await session.commitTransaction();
      return { message: 'Successfully logged out' };
    } catch (error) {
      await session.abortTransaction();
      throw new InternalServerErrorException('Error during logout');
    } finally {
      session.endSession();
    }
  }

  async getProfile(userId: string): Promise<{
    id: string;
    email: string;
    fullName: string;
    role: Role;
    phone?: string;
    address?: string;
    avatar?: string;
    isEmailVerified: boolean;
    lastLogin?: Date;
  }> {
    const account = await this.accountModel.findOne({
      _id: userId,
      isActive: true,
    });

    if (!account) {
      throw new UnauthorizedException('Account not found');
    }

    return {
      id: account.id,
      email: account.email,
      fullName: account.fullName,
      role: account.role,
      phone: account.phone,
      address: account.address,
      avatar: account.avatar,
      isEmailVerified: account.isEmailVerified,
      lastLogin: account.lastLogin,
    };
  }

  async findById(id: string) {
    try {
      const account = await this.accountModel.findById(id).exec();
      if (!account) {
        return null;
      }
      return {
        id: account.id,
        email: account.email,
        fullName: account.fullName,
        role: account.role,
        isEmailVerified: account.isEmailVerified,
        lastLogin: account.lastLogin || new Date(),
      };
    } catch (error) {
      this.logger.error(
        'Error finding account by id',
        error instanceof Error ? error.stack : undefined,
        'AuthService',
      );
      throw new InternalServerErrorException('Failed to find account');
    }
  }

  private async generateTokens(
    account: AccountDocument,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: account.id,
      email: account.email,
      role: account.role,
    };

    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');

    if (!jwtSecret || !refreshSecret) {
      throw new Error('JWT secrets are not properly configured');
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtSecret,
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async refreshTokenWithoutUser(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // Decode the refresh token to get user ID
      const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
      if (!refreshSecret) {
        throw new Error('JWT_REFRESH_SECRET is not defined');
      }

      try {
        // First, verify the token's signature and expiration
        const decoded = this.jwtService.verify(refreshToken, { secret: refreshSecret });
        const userId = decoded.sub;

        // Debug log
        this.logger.debug(`Attempting to refresh token for user ID: ${userId}`);

        // Find the account
        const account = await this.accountModel.findOne({
          _id: userId,
          isActive: true,
        }).session(session);

        if (!account) {
          this.logger.warn(`User with ID ${userId} not found or inactive`);
          throw new UnauthorizedException('User not found or inactive');
        }

        // Check if user has a stored refresh token
        if (!account.refreshToken) {
          this.logger.warn(`User with ID ${userId} has no stored refresh token (might be logged out)`);
          throw new UnauthorizedException('User is logged out. Please login again.');
        }

        // Generate new tokens
        const tokens = await this.generateTokens(account);

        // Update the refresh token in the database
        await this.accountModel
          .updateOne({ _id: account._id }, { refreshToken: tokens.refreshToken })
          .session(session);

        await session.commitTransaction();
        return tokens;
      } catch (tokenError) {
        this.logger.error(
          'Error verifying refresh token',
          tokenError instanceof Error ? tokenError.stack : undefined,
          'AuthService',
        );
        throw new UnauthorizedException('Invalid or expired refresh token');
      }
    } catch (error) {
      await session.abortTransaction();
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Error during token refresh');
    } finally {
      session.endSession();
    }
  }
}
