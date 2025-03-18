import { MigrationInterface, QueryRunner } from 'typeorm';

export class SessionTrancriptAudioFile1742295980273 implements MigrationInterface {
  name = 'SessionTrancriptAudioFile1742295980273';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN "audioFile"`);
    await queryRunner.query(`ALTER TABLE "sessions" ADD "audioFile" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN "audioFile"`);
    await queryRunner.query(`ALTER TABLE "sessions" ADD "audioFile" integer`);
  }
}
