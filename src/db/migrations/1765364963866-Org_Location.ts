import { MigrationInterface, QueryRunner } from "typeorm";

export class OrgLocation1765364963866 implements MigrationInterface {
    name = 'OrgLocation1765364963866'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organizations" ADD "country" character varying`);
        await queryRunner.query(`ALTER TABLE "organizations" ADD "state" character varying`);
        await queryRunner.query(`ALTER TABLE "organizations" ADD "city" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN "city"`);
        await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN "state"`);
        await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN "country"`);
    }

}
