import { Module } from '@nestjs/common';
import { RoleBasedAccessService } from './role-based-access.service';
import { DataAccessService } from './data-access.service';

@Module({
  providers: [RoleBasedAccessService, DataAccessService],
  exports: [RoleBasedAccessService, DataAccessService],
})
export class CommonServicesModule {}
