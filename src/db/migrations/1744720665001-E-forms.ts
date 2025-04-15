import { MigrationInterface, QueryRunner } from "typeorm";

export class EForms1744720665001 implements MigrationInterface {
    name = 'EForms1744720665001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "edocuments" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "documentName" character varying NOT NULL, "type" character varying, "description" text NOT NULL, "images" text NOT NULL, "fields" jsonb NOT NULL, "templateDocHash" character varying, "status" character varying, CONSTRAINT "PK_0489354d790456faf41ed1b83a8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "edocument_issuances" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "documentId" integer NOT NULL, "patientId" integer, "doctorId" integer NOT NULL, "issuedToOrgCode" character varying, "description" text, "fieldValues" jsonb NOT NULL, "businessProductId" character varying, "tagId" character varying, CONSTRAINT "PK_8b9c12d021e4a6b2bd94d0e11e5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_57de40bc620f456c7311aa3a1e6"`);
        await queryRunner.query(`ALTER TABLE "sessions" ALTER COLUMN "userId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_57de40bc620f456c7311aa3a1e6" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "edocument_issuances" ADD CONSTRAINT "FK_a85945b713b3cac89a05380b08c" FOREIGN KEY ("documentId") REFERENCES "edocuments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "edocument_issuances" ADD CONSTRAINT "FK_e1f2cd6452c68bc831729541f25" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "edocument_issuances" ADD CONSTRAINT "FK_fa3cba4530ce52f9ca08527170e" FOREIGN KEY ("doctorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "edocument_issuances" DROP CONSTRAINT "FK_fa3cba4530ce52f9ca08527170e"`);
        await queryRunner.query(`ALTER TABLE "edocument_issuances" DROP CONSTRAINT "FK_e1f2cd6452c68bc831729541f25"`);
        await queryRunner.query(`ALTER TABLE "edocument_issuances" DROP CONSTRAINT "FK_a85945b713b3cac89a05380b08c"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_57de40bc620f456c7311aa3a1e6"`);
        await queryRunner.query(`ALTER TABLE "sessions" ALTER COLUMN "userId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_57de40bc620f456c7311aa3a1e6" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`DROP TABLE "edocument_issuances"`);
        await queryRunner.query(`DROP TABLE "edocuments"`);
    }

}
