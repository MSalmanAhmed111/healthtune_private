import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserSettings1744617227352 implements MigrationInterface {
  name = 'UserSettings1744617227352';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "setting" ADD "isGlobal" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "setting" ADD "userId" integer`);
    await queryRunner.query(`ALTER TABLE "setting" ADD CONSTRAINT "FK_bbcafb8c4c78d890f75caa632d5" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "setting" DROP CONSTRAINT "FK_bbcafb8c4c78d890f75caa632d5"`);
    await queryRunner.query(`ALTER TABLE "setting" DROP COLUMN "userId"`);
    await queryRunner.query(`ALTER TABLE "setting" DROP COLUMN "isGlobal"`);
  }
}
