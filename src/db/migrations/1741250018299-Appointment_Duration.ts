import { MigrationInterface, QueryRunner } from 'typeorm';

export class AppointmentDuration1741250018299 implements MigrationInterface {
  name = 'AppointmentDuration1741250018299';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "appointment" ADD "duration" numeric(10,2)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "appointment" DROP COLUMN "duration"`);
  }
}
