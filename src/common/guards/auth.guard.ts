import { type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { AuthTypeValue } from 'aws-sdk/clients/dms';
import { AUTH_TYPE_KEY } from '../decorators/auth-type.decorator';
import { AuthTypeEnum } from '@types';

@Injectable()
export class ClerkAuthGuard extends AuthGuard(['jwt', 'clerk']) {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [context.getHandler(), context.getClass()]);
    if (isPublic) return true;

    const authType: AuthTypeValue = this.reflector.get<AuthTypeValue>(AUTH_TYPE_KEY, context.getHandler()) || this.reflector.get<AuthTypeValue>(AUTH_TYPE_KEY, context.getClass()) || AuthTypeEnum.CLERK;

 
    // Attach authType to request for use in services
    const request = context.switchToHttp().getRequest();
    (request as any).authType = authType;

    // Call super and wait for result to ensure user is populated before we use it
    const result = super.canActivate(context);
    
    // If result is a Promise, we need to handle it asynchronously
    if (result instanceof Promise) {
      return result.then(isValid => {
        if (isValid) {
          // Re-attach authType after Passport has done its thing
          (request as any).authType = authType;
          console.log(`🔐 Auth Guard - authType attached to request: ${JSON.stringify(authType)}`);
        }
        return isValid;
      });
    }
    
    return result;
  }
}
