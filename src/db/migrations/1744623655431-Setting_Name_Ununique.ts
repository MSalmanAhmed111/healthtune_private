import { MigrationInterface, QueryRunner } from 'typeorm';

export class SettingNameUnunique1744623655431 implements MigrationInterface {
  name = 'SettingNameUnunique1744623655431';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "setting" DROP CONSTRAINT "UQ_27923d152bbf82683ab795d5476"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "setting" ADD CONSTRAINT "UQ_27923d152bbf82683ab795d5476" UNIQUE ("name")`);
  }
}
