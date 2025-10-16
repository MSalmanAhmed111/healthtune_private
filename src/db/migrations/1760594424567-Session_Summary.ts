import { MigrationInterface, QueryRunner } from "typeorm";

export class SessionSummary1760594424567 implements MigrationInterface {
    name = 'SessionSummary1760594424567'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sessions" ADD "summary" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN "summary"`);
    }

}
