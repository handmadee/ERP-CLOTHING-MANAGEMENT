import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';
import { ROLES_KEY } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/enums/role.enum';
import { CustomLogger } from '../../../common/services/logger.service';

@Injectable()
export class AuthGuard extends PassportAuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private readonly logger: CustomLogger,
  ) {
    super();
    this.logger.setContext('AuthGuard');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      const requestId = request.headers['x-request-id'] || undefined;
      // Set requestId for logger
      this.logger.setRequestId(requestId);
      // Check if endpoint is public
      const isPublic = this.reflector.getAllAndOverride<boolean>(
        IS_PUBLIC_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (isPublic) {
        return true;
      }


      const authHeader = request.headers.authorization;
      console.log("🚀 ~ AuthGuard ~ canActivate ~ authHeader:", request.headers)
      if (!authHeader) {
        this.logger.warn('No Authorization header found');
        throw new UnauthorizedException('No Authorization header provided');
      } else {
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
          this.logger.warn(`Invalid Authorization header format: ${parts[0]} [token masked]`);
          throw new UnauthorizedException('Invalid Authorization header format. Use: Bearer [token]');
        }

        // Mask token except first 10 chars for logging
        const tokenPreview = parts[1].substring(0, 10) + '...';
        this.logger.debug(`Processing token: ${tokenPreview}`);
      }

      try {
        const isValid = await super.canActivate(context);
        console.log("🚀 ~ AuthGuard ~ canActivate ~ isValid:", isValid)
        if (!isValid) {
          throw new UnauthorizedException('Invalid or expired token');
        }
      } catch (error) {
        this.logger.error(`JWT validation failed: ${error.message}`, error);
        throw new UnauthorizedException(`Authentication failed: ${error.message}`);
      }

      // Get required roles
      const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
        ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );
      console.log("🚀 ~ AuthGuard ~ canActivate ~ requiredRoles:", requiredRoles)

      if (!requiredRoles || requiredRoles.length === 0) {
        return true;
      }

      // Get request and user
      const { user } = request;
      console.log("🚀 ~ AuthGuard ~ canActivate ~ user:", user)
      if (!user) {
        this.logger.error('User not found in token');
        throw new UnauthorizedException('User not found in token');
      }

      this.logger.log(`User ${user.email} (${user.sub}) accessed endpoint`, {
        endpoint: `${request.method} ${request.url}`,
        userId: user.sub,
      });

      // Validate roles
      const hasRole = requiredRoles.some((role) => user.role === role);
      if (!hasRole) {
        this.logger.warn(`User ${user.email} has insufficient role: ${user.role}, required: ${requiredRoles.join(', ')}`, {
          userId: user.sub,
        });
        throw new ForbiddenException(`User role ${user.role} is not authorized to access this resource`);
      }

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        throw error;
      }

      this.logger.error('Authentication process failed', error);
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
