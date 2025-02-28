import { MigrationInterface, QueryRunner } from "typeorm";

export class FileStorage1740716453070 implements MigrationInterface {
    name = 'FileStorage1740716453070'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "file_storage" ("id" SERIAL NOT NULL, "type" character varying(100) NOT NULL, "name" character varying, "location" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2834b5398654dd125afabfd0dc2" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "file_storage"`);
    }

}
