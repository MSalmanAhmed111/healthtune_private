import { MigrationInterface, QueryRunner } from 'typeorm';

export class SessionAudioFile1741160913530 implements MigrationInterface {
  name = 'SessionAudioFile1741160913530';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sessions" ADD "audioFile" integer`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN "audioFile"`);
  }
}
