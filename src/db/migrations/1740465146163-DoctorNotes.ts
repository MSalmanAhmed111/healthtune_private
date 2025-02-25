import { MigrationInterface, QueryRunner } from "typeorm";

export class DoctorNotes1740465146163 implements MigrationInterface {
    name = 'DoctorNotes1740465146163'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "doctor_notes" ("id" SERIAL NOT NULL, "sessionId" integer NOT NULL, "content" jsonb NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_0a82a0c3f84ca327f3502f938c" UNIQUE ("sessionId"), CONSTRAINT "PK_3715445b9f7982ed2dd01f9fd17" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD "doctorNotesId" integer`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "UQ_6a21f366b387af5ab092e352a4f" UNIQUE ("doctorNotesId")`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_57de40bc620f456c7311aa3a1e6"`);
        await queryRunner.query(`ALTER TABLE "doctor_notes" ADD CONSTRAINT "FK_0a82a0c3f84ca327f3502f938cd" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_6a21f366b387af5ab092e352a4f" FOREIGN KEY ("doctorNotesId") REFERENCES "doctor_notes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_57de40bc620f456c7311aa3a1e6" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_57de40bc620f456c7311aa3a1e6"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_6a21f366b387af5ab092e352a4f"`);
        await queryRunner.query(`ALTER TABLE "doctor_notes" DROP CONSTRAINT "FK_0a82a0c3f84ca327f3502f938cd"`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_57de40bc620f456c7311aa3a1e6" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "UQ_6a21f366b387af5ab092e352a4f"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN "doctorNotesId"`);
        await queryRunner.query(`DROP TABLE "doctor_notes"`);
    }

}
