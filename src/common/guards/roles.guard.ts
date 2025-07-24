import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@entities';
import { RoleBasedAccessService } from '../services/role-based-access.service';
import { DefaultRoleEnum } from '@types';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly roleBasedAccessService: RoleBasedAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true; // No role requirement
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    const user = await this.userRepository.findOne({ 
      where: { id: userId },
      relations: ['organization'] 
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const userContext = this.roleBasedAccessService.getUserOrganizationContext(user);
    
    return requiredRoles.includes(userContext.role);
  }
}

function SetMetadata(key: string, value: string[]): MethodDecorator & ClassDecorator {
  return (target: any, propertyKey?: any) => {
    Reflect.defineMetadata(key, value, propertyKey ? target[propertyKey] : target);
  };
}
