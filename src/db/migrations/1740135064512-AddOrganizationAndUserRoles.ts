import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrganizationAndUserRoles1740135064512 implements MigrationInterface {
  name = 'AddOrganizationAndUserRoles1740135064512';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create organizations table
    await queryRunner.query(
      `CREATE TABLE "organizations" (
        "id" SERIAL NOT NULL, 
        "clerkOrganizationId" character varying NOT NULL, 
        "name" character varying NOT NULL, 
        "slug" character varying, 
        "imageUrl" character varying, 
        "publicMetadata" jsonb, 
        "privateMetadata" jsonb, 
        "isActive" boolean NOT NULL DEFAULT true, 
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), 
        CONSTRAINT "UQ_organizations_clerkOrganizationId" UNIQUE ("clerkOrganizationId"), 
        CONSTRAINT "PK_organizations_id" PRIMARY KEY ("id")
      )`
    );

    // Add organization and role columns to users table
    await queryRunner.query(`ALTER TABLE "users" ADD "organizationId" integer`);
    await queryRunner.query(`ALTER TABLE "users" ADD "clerkOrganizationId" character varying`);
    await queryRunner.query(`ALTER TABLE "users" ADD "role" character varying NOT NULL DEFAULT 'doctor'`);
    await queryRunner.query(`ALTER TABLE "users" ADD "rolePermissions" jsonb`);

    // Add foreign key constraint
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_users_organizationId" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );

    // Create index for performance
    await queryRunner.query(`CREATE INDEX "IDX_users_clerkOrganizationId" ON "users" ("clerkOrganizationId")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_role" ON "users" ("role")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_users_role"`);
    await queryRunner.query(`DROP INDEX "IDX_users_clerkOrganizationId"`);

    // Drop foreign key constraint
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_organizationId"`);

    // Remove columns from users table
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "rolePermissions"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "clerkOrganizationId"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "organizationId"`);

    // Drop organizations table
    await queryRunner.query(`DROP TABLE "organizations"`);
  }
}
