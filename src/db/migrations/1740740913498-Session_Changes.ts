import { MigrationInterface, QueryRunner } from "typeorm";

export class SessionChanges1740740913498 implements MigrationInterface {
    name = 'SessionChanges1740740913498'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "diagnosis_codes" ("id" SERIAL NOT NULL, "sessionId" integer NOT NULL, "content" jsonb NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_2cccef1b712e6c75d68fbb6063" UNIQUE ("sessionId"), CONSTRAINT "PK_eb0b893cd3586566674519eb789" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD "duration" numeric`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD "diagnosisCodesId" integer`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "UQ_b730738034b2696228dfef29c91" UNIQUE ("diagnosisCodesId")`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_b730738034b2696228dfef29c91" FOREIGN KEY ("diagnosisCodesId") REFERENCES "diagnosis_codes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "diagnosis_codes" ADD CONSTRAINT "FK_2cccef1b712e6c75d68fbb60631" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "diagnosis_codes" DROP CONSTRAINT "FK_2cccef1b712e6c75d68fbb60631"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_b730738034b2696228dfef29c91"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "UQ_b730738034b2696228dfef29c91"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN "diagnosisCodesId"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN "duration"`);
        await queryRunner.query(`DROP TABLE "diagnosis_codes"`);
    }

}
