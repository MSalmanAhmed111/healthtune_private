import { MigrationInterface, QueryRunner } from 'typeorm';

export class Stripe1742813032398 implements MigrationInterface {
  name = 'Stripe1742813032398';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "stripeCustomerId" character varying`);
    await queryRunner.query(`ALTER TABLE "users" ADD "stripeSubscriptiontId" character varying`);
    await queryRunner.query(`ALTER TABLE "plans" ADD "stripePriceId" character varying`);
    await queryRunner.query(`ALTER TABLE "plans" ADD "stripeProductId" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "stripeProductId"`);
    await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "stripePriceId"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "stripeSubscriptiontId"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "stripeCustomerId"`);
  }
}
