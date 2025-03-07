import { MigrationInterface, QueryRunner } from 'typeorm';

export class TemplatesLanguage1741339598647 implements MigrationInterface {
  name = 'TemplatesLanguage1741339598647';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "templates" ADD "language" character varying NOT NULL DEFAULT 'en'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "templates" DROP COLUMN "language"`);
  }
}
