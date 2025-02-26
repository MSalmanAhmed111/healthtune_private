import { MigrationInterface, QueryRunner } from "typeorm";

export class Settings1740388750356 implements MigrationInterface {
    name = 'Settings1740388750356'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "setting" ("id" SERIAL NOT NULL, "type" character varying(100) NOT NULL, "name" character varying(100) NOT NULL, "value" jsonb NOT NULL, "context" character varying(100) NOT NULL, CONSTRAINT "UQ_27923d152bbf82683ab795d5476" UNIQUE ("name"), CONSTRAINT "PK_fcb21187dc6094e24a48f677bed" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "setting"`);
    }

}
