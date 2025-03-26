import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserCard1742976770229 implements MigrationInterface {
  name = 'UserCard1742976770229';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "cardAdded" boolean NOT NULL DEFAULT false`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "cardAdded"`);
  }
}
