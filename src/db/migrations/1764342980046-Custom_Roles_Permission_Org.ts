import { MigrationInterface, QueryRunner } from "typeorm";

export class CustomRolesPermissionOrg1764342980046 implements MigrationInterface {
    name = 'CustomRolesPermissionOrg1764342980046'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "roles" ADD "organizationId" integer`);
        await queryRunner.query(`ALTER TABLE "roles" ADD "isSystemRole" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "roles" DROP CONSTRAINT "UQ_a87cf0659c3ac379b339acf36a2"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_75f8d073b04ef1b87cc198e9f7" ON "roles" ("key") WHERE "organizationId" IS NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_531e66e8da09ee32a00065dc41" ON "roles" ("organizationId", "key") WHERE "organizationId" IS NOT NULL`);
        await queryRunner.query(`ALTER TABLE "roles" ADD CONSTRAINT "FK_0933e1dfb2993d672af1a98f08e" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "roles" DROP CONSTRAINT "FK_0933e1dfb2993d672af1a98f08e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_531e66e8da09ee32a00065dc41"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_75f8d073b04ef1b87cc198e9f7"`);
        await queryRunner.query(`ALTER TABLE "roles" ADD CONSTRAINT "UQ_a87cf0659c3ac379b339acf36a2" UNIQUE ("key")`);
        await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "isSystemRole"`);
        await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "organizationId"`);
    }

}
