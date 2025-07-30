import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from 'src/entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { user } = request;

    const requiredTokenAuth = this.reflector.getAllAndOverride<string[]>('tokenAuth', [context.getHandler(), context.getClass()]);
    if (requiredTokenAuth) return true;

    //console.log({ user });
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>('permissions', [context.getHandler(), context.getClass()]);
    if (!requiredPermissions) return true;
    if (!user.role) return true;
    // else if (!user) {

    //     if (!request.query.t) throw new UnauthorizedException('No token provided');
    //     return true;
    //   }
    // }

    const role = await this.roleRepository.findOne({
      where: { key: user.role },
      relations: ['permissions'],
    });

    if (!role) throw new UnauthorizedException('Unauthorized');

    const userPermissions = role.permissions.map((permission) => permission.key);

    const hasPermission = requiredPermissions.some((permission) => userPermissions.includes(permission));
    if (!hasPermission) throw new UnauthorizedException('Unauthorized');

    return true;
  }
}
