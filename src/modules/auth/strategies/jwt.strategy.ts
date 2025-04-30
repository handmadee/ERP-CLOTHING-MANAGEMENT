import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private readonly configService: ConfigService) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });

    this.logger.log('JWT Strategy initialized');
  }

  async validate(payload: JwtPayload): Promise<{
    userId: string;
    email: string;
    role: string;
  }> {
    try {
      this.logger.debug(`Validating JWT payload for: ${payload.email}`);
      if (!payload.sub) {
        this.logger.warn('Token payload missing sub (user ID)');
        throw new UnauthorizedException('Invalid token: missing user ID');
      }
      if (!payload.email) {
        this.logger.warn(`Token payload for user ${payload.sub} missing email`);
        throw new UnauthorizedException('Invalid token: missing email');
      }
      if (!payload.role) {
        this.logger.warn(`Token payload for user ${payload.sub} missing role`);
        throw new UnauthorizedException('Invalid token: missing role');
      }
      this.logger.debug(`JWT validated successfully for user: ${payload.email} (${payload.sub})`);
      return {
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
      };
    } catch (error) {
      this.logger.error(`JWT validation error: ${error.message}`);
      throw error;
    }
  }
}
