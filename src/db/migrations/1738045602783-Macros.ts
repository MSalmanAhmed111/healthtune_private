import { MigrationInterface, QueryRunner } from "typeorm";

export class Macros1738045602783 implements MigrationInterface {
    name = 'Macros1738045602783'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "macros" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "content" character varying NOT NULL, CONSTRAINT "UQ_d8bf162fa0262b9a1006fc45e3a" UNIQUE ("name"), CONSTRAINT "PK_cc6dbe6db03bd5465a8ace61be5" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "macros"`);
    }

}
