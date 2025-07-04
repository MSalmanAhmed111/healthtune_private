import { MigrationInterface, QueryRunner } from "typeorm";

export class TemplateUpdt1751630973293 implements MigrationInterface {
    name = 'TemplateUpdt1751630973293'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "templates" ADD "isDefault" character varying NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "templates" DROP COLUMN "isDefault"`);
    }

}
