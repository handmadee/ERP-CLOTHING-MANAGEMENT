import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CustomLogger } from '../../../common/services/logger.service';
import { NotFoundError, Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly logger: CustomLogger) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      let reason = 'Unauthorized access';
      if (err?.message) {
        reason = err.message;
      } else if (info?.message) {
        reason = info.message;
      } else if (typeof info === 'string') {
        reason = info;
      }
      this.logger.error('JWT authentication failed', reason, 'JwtAuthGuard');
      throw new UnauthorizedException(reason);
    }

    return user;
  }
}
