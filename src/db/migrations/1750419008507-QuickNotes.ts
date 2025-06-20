import { MigrationInterface, QueryRunner } from "typeorm";

export class QuickNotes1750419008507 implements MigrationInterface {
    name = 'QuickNotes1750419008507'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "quick_notes" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "file" character varying NOT NULL, "transcript" text NOT NULL, "userId" integer NOT NULL, CONSTRAINT "PK_3ac7b56dada46596b8f643e3bed" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "quick_notes" ADD CONSTRAINT "FK_3aa5d86032919e562536a857761" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "quick_notes" DROP CONSTRAINT "FK_3aa5d86032919e562536a857761"`);
        await queryRunner.query(`DROP TABLE "quick_notes"`);
    }

}
