import { MigrationInterface, QueryRunner } from 'typeorm';

export class SessionPatient1741765195395 implements MigrationInterface {
  name = 'SessionPatient1741765195395';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sessions" ADD "patientId" integer`);
    await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_a9af6b7e40b0b2f0ba730cd4c21" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_a9af6b7e40b0b2f0ba730cd4c21"`);
    await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN "patientId"`);
  }
}
