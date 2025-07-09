import { MigrationInterface, QueryRunner } from "typeorm";

export class PatientUpdt1752056481307 implements MigrationInterface {
    name = 'PatientUpdt1752056481307'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "patients" ADD "languagePreference" character varying DEFAULT 'English'`);
        await queryRunner.query(`ALTER TABLE "patients" ADD "insuranceDetailsEffectivedate" date`);
        await queryRunner.query(`ALTER TABLE "patients" ADD "insuranceDetailsType" character varying DEFAULT 'Private'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "patients" DROP COLUMN "insuranceDetailsType"`);
        await queryRunner.query(`ALTER TABLE "patients" DROP COLUMN "insuranceDetailsEffectivedate"`);
        await queryRunner.query(`ALTER TABLE "patients" DROP COLUMN "languagePreference"`);
    }

}
