import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Array<'admin' | 'staff' | 'customer'>>(
      ROLES_KEY,
      [
      context.getHandler(),
      context.getClass(),
      ],
    );

    if (!roles || roles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const roleCode = request.user?.roleCode;

    if (!roleCode || !roles.includes(roleCode)) {
      throw new ForbiddenException('No permission to access this resource');
    }

    return true;
  }
}
