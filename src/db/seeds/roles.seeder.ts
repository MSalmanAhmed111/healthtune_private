import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { Role } from '../../entity/role.entity';
import { Permission } from '../../entity/permissions.entity';
import { PermissionEnum, UserRolesEnum } from '../../types/types';

export default class RolesSeeder implements Seeder {
  // Define permissions that can be easily updated
  private readonly PERMISSIONS = [
    // Appointment permissions
    {
      key: PermissionEnum.CREATE_APPOINTMENT,
      name: 'Create Appointment',
      description: 'Ability to create new appointments',
    },
    {
      key: PermissionEnum.VIEW_ALL_APPOINTMENTS,
      name: 'View All Appointments',
      description: 'Ability to view all organization appointments',
    },
    {
      key: PermissionEnum.VIEW_APPOINTMENT,
      name: 'View Appointment',
      description: 'Ability to view individual appointments',
    },
    // Patient permissions
    {
      key: PermissionEnum.CREATE_PATIENT,
      name: 'Create Patient',
      description: 'Ability to create new patients',
    },
    {
      key: PermissionEnum.VIEW_ALL_PATIENTS,
      name: 'View All Patients',
      description: 'Ability to view all organization patients',
    },
    {
      key: PermissionEnum.VIEW_PATIENT,
      name: 'View Patient',
      description: 'Ability to view individual patients',
    },
    // Session permissions
    {
      key: PermissionEnum.CREATE_PATIENT_SESSION,
      name: 'Create Patient Session',
      description: 'Ability to create sessions with patients',
    },
    {
      key: PermissionEnum.SESSION_HISTORY,
      name: 'Session History',
      description: 'Ability to view session history',
    },
    {
      key: PermissionEnum.VIEW_ALL_SESSIONS,
      name: 'View All Sessions',
      description: 'Ability to view all organization sessions',
    },
    {
      key: PermissionEnum.VIEW_SESSION,
      name: 'View Session',
      description: 'Ability to view individual sessions',
    },
    {
      key: PermissionEnum.CREATE_SESSION_FEEDBACK,
      name: 'Create Session Feedback',
      description: 'Ability to submit feedback for sessions',
    },
    {
      key: PermissionEnum.VIEW_SESSION_FEEDBACK,
      name: 'View Session Feedback',
      description: 'Ability to view feedback for sessions',
    },
    // Management permissions
    {
      key: PermissionEnum.VIEW_ALL_SESSION_SESSIONS,
      name: 'View All Session Sessions',
      description: 'Ability to view all session sessions',
    },
    {
      key: PermissionEnum.MANAGE_CUSTOMIZATIONS,
      name: 'Manage Customizations',
      description: 'Ability to manage templates and macros',
    },
  ];

  // Define roles with their permissions that can be easily updated
  private readonly ROLES = [
    {
      key: 'org:admin',
      name: UserRolesEnum.ADMIN,
      description: 'Full administrative access to the organization',
      permissions: [
        PermissionEnum.VIEW_ALL_PATIENTS,
        PermissionEnum.CREATE_PATIENT,
        PermissionEnum.VIEW_PATIENT,
        PermissionEnum.VIEW_ALL_APPOINTMENTS,
        PermissionEnum.CREATE_APPOINTMENT,
        PermissionEnum.VIEW_APPOINTMENT,
        PermissionEnum.CREATE_PATIENT_SESSION,
        PermissionEnum.VIEW_ALL_SESSIONS,
        PermissionEnum.VIEW_SESSION,
        PermissionEnum.SESSION_HISTORY,
        PermissionEnum.CREATE_SESSION_FEEDBACK,
        PermissionEnum.VIEW_SESSION_FEEDBACK,
        PermissionEnum.VIEW_ALL_SESSION_SESSIONS,
        PermissionEnum.MANAGE_CUSTOMIZATIONS,
      ],
    },
    {
      key: 'org:staff',
      name: UserRolesEnum.STAFF,
      description: 'Staff member with organization-wide access',
      permissions: [
        PermissionEnum.VIEW_ALL_PATIENTS,
        PermissionEnum.CREATE_PATIENT,
        PermissionEnum.VIEW_PATIENT,
        PermissionEnum.VIEW_ALL_APPOINTMENTS,
        PermissionEnum.CREATE_APPOINTMENT,
        PermissionEnum.VIEW_APPOINTMENT,
        PermissionEnum.VIEW_ALL_SESSIONS,
        PermissionEnum.VIEW_SESSION,
        PermissionEnum.SESSION_HISTORY,
        PermissionEnum.CREATE_SESSION_FEEDBACK,
        PermissionEnum.VIEW_SESSION_FEEDBACK,
        PermissionEnum.MANAGE_CUSTOMIZATIONS,
      ],
    },
    {
      key: 'org:doctor',
      name: UserRolesEnum.DOCTOR,
      description: "Doctor with limited access to own patients and today's appointments",
      permissions: [PermissionEnum.VIEW_PATIENT, PermissionEnum.VIEW_APPOINTMENT, PermissionEnum.CREATE_PATIENT_SESSION, PermissionEnum.VIEW_SESSION, PermissionEnum.CREATE_SESSION_FEEDBACK, PermissionEnum.VIEW_SESSION_FEEDBACK],
    },
    // You can easily add more roles here
    // {
    //   key: 'org:nurse',
    //   name: 'Nurse',
    //   description: 'Nurse with patient care access',
    //   permissions: [
    //     PermissionEnum.VIEW_PATIENT,
    //     PermissionEnum.VIEW_APPOINTMENT,
    //     PermissionEnum.VIEW_SESSION,
    //   ],
    // },
  ];

  public async run(dataSource: DataSource): Promise<any> {
    const roleRepository = dataSource.getRepository(Role);
    const permissionRepository = dataSource.getRepository(Permission);

    console.log('🚀 Starting default roles and permissions seeding...');

    try {
      // Step 1: Create/Update Permissions
      console.log('📝 Creating/Updating permissions...');
      const permissionsMap = await this.createOrUpdatePermissions(permissionRepository);

      // Step 2: Create/Update Roles
      console.log('👥 Creating/Updating roles...');
      await this.createOrUpdateRoles(roleRepository, permissionsMap);

      console.log('✅ Default roles and permissions seeding completed successfully!');
      console.log(`📊 Total permissions: ${this.PERMISSIONS.length}`);
      console.log(`📊 Total roles: ${this.ROLES.length}`);
    } catch (error) {
      console.error('❌ Error during roles and permissions seeding:', error);
      throw error;
    }
  }

  /**
   * Create or update permissions
   */
  private async createOrUpdatePermissions(permissionRepository: any): Promise<Map<string, Permission>> {
    const permissionsMap = new Map<string, Permission>();

    for (const permData of this.PERMISSIONS) {
      console.log(`🔑 Processing permission: ${permData.name} (${permData.key})`);

      // Check if permission already exists
      let permission = await permissionRepository.findOne({
        where: { key: permData.key },
      });

      if (!permission) {
        // Create new permission
        permission = permissionRepository.create({
          clerkPermissionId: null,
          key: permData.key,
          name: permData.name,
          description: permData.description,
        });
        permission = await permissionRepository.save(permission);
        console.log(`✅ Created new permission: ${permData.name}`);
      } else {
        // Update existing permission (in case name/description changed)
        let hasChanges = false;

        if (permission.name !== permData.name) {
          permission.name = permData.name;
          hasChanges = true;
        }

        if (permission.description !== permData.description) {
          permission.description = permData.description;
          hasChanges = true;
        }

        if (hasChanges) {
          permission = await permissionRepository.save(permission);
          console.log(`🔄 Updated existing permission: ${permData.name}`);
        } else {
          console.log(`📋 Permission already up to date: ${permData.name}`);
        }
      }

      permissionsMap.set(permData.key, permission);
    }

    return permissionsMap;
  }

  /**
   * Create or update roles with their permissions
   */
  private async createOrUpdateRoles(roleRepository: any, permissionsMap: Map<string, Permission>): Promise<void> {
    for (const roleData of this.ROLES) {
      console.log(`👤 Processing role: ${roleData.name} (${roleData.key})`);

      // Check if role already exists
      let role = await roleRepository.findOne({
        where: { key: roleData.key },
        relations: ['permissions'],
      });

      if (!role) {
        // Create new role as system-level (organizationId = null, isSystemRole = true)
        role = roleRepository.create({
          clerkRoleId: null,
          key: roleData.key,
          name: roleData.name,
          description: roleData.description,
          organizationId: null,
          isSystemRole: true,
        });
        role = await roleRepository.save(role);
        console.log(`✅ Created new system-level role: ${roleData.name}`);
      } else {
        // Update existing role (in case name/description changed)
        let hasChanges = false;

        if (role.name !== roleData.name) {
          role.name = roleData.name;
          hasChanges = true;
        }

        if (role.description !== roleData.description) {
          role.description = roleData.description;
          hasChanges = true;
        }

        if (role.organizationId !== null) {
          role.organizationId = null;
          hasChanges = true;
        }

        if (!role.isSystemRole) {
          role.isSystemRole = true;
          hasChanges = true;
        }

        if (hasChanges) {
          role = await roleRepository.save(role);
          console.log(`🔄 Updated existing role: ${roleData.name}`);
        } else {
          console.log(`📋 Role already up to date: ${roleData.name}`);
        }
      }

      // Get permissions for this role
      const rolePermissions: Permission[] = [];
      const missingPermissions: string[] = [];

      for (const permKey of roleData.permissions) {
        const permission = permissionsMap.get(permKey);
        if (permission) {
          rolePermissions.push(permission);
        } else {
          missingPermissions.push(permKey);
        }
      }

      // Log missing permissions
      if (missingPermissions.length > 0) {
        console.warn(`⚠️ Missing permissions for role ${roleData.name}:`, missingPermissions);
      }

      // Check if permissions need to be updated
      const currentPermissionKeys = role.permissions?.map((p) => p.key) || [];
      const newPermissionKeys = rolePermissions.map((p) => p.key);

      const permissionsChanged = currentPermissionKeys.length !== newPermissionKeys.length || currentPermissionKeys.some((key) => !newPermissionKeys.includes(key)) || newPermissionKeys.some((key) => !currentPermissionKeys.includes(key));

      if (permissionsChanged) {
        // Update role permissions
        role.permissions = rolePermissions;
        await roleRepository.save(role);
        console.log(`🔗 Updated permissions for role ${roleData.name}: ${rolePermissions.length} permissions assigned`);

        // Log permission details
        if (rolePermissions.length > 0) {
          console.log(`   Permissions: ${rolePermissions.map((p) => p.name).join(', ')}`);
        }
      } else {
        console.log(`📋 Permissions already up to date for role: ${roleData.name}`);
      }
    }
  }
}
