import { MigrationInterface, QueryRunner } from "typeorm";

export class Organization1753692434746 implements MigrationInterface {
    name = 'Organization1753692434746'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "organizations" ("id" SERIAL NOT NULL, "clerkOrganizationId" character varying NOT NULL, "name" character varying NOT NULL, "slug" character varying, "imageUrl" character varying, "publicMetadata" jsonb, "privateMetadata" jsonb, "roles" jsonb, "defaultRole" character varying NOT NULL DEFAULT 'doctor', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_5420a0a506e75789ababa438453" UNIQUE ("clerkOrganizationId"), CONSTRAINT "PK_6b031fcd0863e3f6b44230163f9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "users" ADD "organizationId" integer`);
        await queryRunner.query(`ALTER TABLE "users" ADD "clerkOrganizationId" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "role" character varying NOT NULL DEFAULT 'doctor'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "organizationRole" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "rolePermissions" jsonb`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_f3d6aea8fcca58182b2e80ce979" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_f3d6aea8fcca58182b2e80ce979"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "rolePermissions"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "organizationRole"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "clerkOrganizationId"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "organizationId"`);
        await queryRunner.query(`DROP TABLE "organizations"`);
    }

}
