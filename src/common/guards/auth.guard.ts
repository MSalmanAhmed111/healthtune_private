import { type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class ClerkAuthGuard extends AuthGuard('clerk') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [context.getHandler(), context.getClass()]);
    if (isPublic) return true;

    const authType = this.reflector.get<string>('authType', context.getHandler()) || this.reflector.get<string>('authType', context.getClass());

    if (authType === 'admin') return new (AuthGuard('admin'))().canActivate(context);
    
    return super.canActivate(context);
  }
}
