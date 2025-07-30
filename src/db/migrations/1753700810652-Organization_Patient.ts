import { MigrationInterface, QueryRunner } from "typeorm";

export class OrganizationPatient1753700810652 implements MigrationInterface {
    name = 'OrganizationPatient1753700810652'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "patients" ADD "organizationId" integer`);
        await queryRunner.query(`ALTER TABLE "patients" ADD CONSTRAINT "FK_976f324a1a35c5b57fbe1539b50" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "patients" DROP CONSTRAINT "FK_976f324a1a35c5b57fbe1539b50"`);
        await queryRunner.query(`ALTER TABLE "patients" DROP COLUMN "organizationId"`);
    }

}
