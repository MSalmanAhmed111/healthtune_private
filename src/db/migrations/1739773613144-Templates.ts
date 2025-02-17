import { MigrationInterface, QueryRunner } from "typeorm";

export class Templates1739773613144 implements MigrationInterface {
    name = 'Templates1739773613144'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "templates" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "title" character varying NOT NULL, "prompt" character varying NOT NULL, CONSTRAINT "UQ_50ab106748d7c282c23557fd17e" UNIQUE ("title"), CONSTRAINT "PK_515948649ce0bbbe391de702ae5" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "templates"`);
    }

}
