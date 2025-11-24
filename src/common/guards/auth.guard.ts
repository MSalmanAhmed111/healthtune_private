import { type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { AuthTypeValue } from 'aws-sdk/clients/dms';
import { AUTH_TYPE_KEY } from '../decorators/auth-type.decorator';
import { AuthTypeEnum } from '@types';

@Injectable()
export class ClerkAuthGuard extends AuthGuard('clerk') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [context.getHandler(), context.getClass()]);
    if (isPublic) return true;

    const authType: AuthTypeValue = this.reflector.get<AuthTypeValue>(AUTH_TYPE_KEY, context.getHandler()) || this.reflector.get<AuthTypeValue>(AUTH_TYPE_KEY, context.getClass()) || AuthTypeEnum.CLERK;

    if (Array.isArray(authType)) {
      if (authType.includes('admin') || authType.includes('org:admin')) {
        return super.canActivate(context);
      }
      if (authType.includes('clerk')) {
        return super.canActivate(context);
      }
    }

    if (authType === 'admin' || authType === 'org:admin' || authType === 'clerk') {
      return super.canActivate(context);
    }

    return super.canActivate(context);
  }
}
