import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserPlan1742283228732 implements MigrationInterface {
  name = 'UserPlan1742283228732';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "user_plan_usage" ("id" SERIAL NOT NULL, "userPlanId" integer NOT NULL, "planFeaturePropertyId" integer NOT NULL, "usageCount" integer, CONSTRAINT "PK_f2471b3b0fea7dd8b0e094a485d" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_fbb7e4af821bd7942c80367c92" ON "user_plan_usage" ("userPlanId") `);
    await queryRunner.query(`CREATE INDEX "IDX_aa4f8eb77cf6d662f952f22d82" ON "user_plan_usage" ("planFeaturePropertyId") `);
    await queryRunner.query(
      `CREATE TABLE "user_plans" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "planId" integer NOT NULL, "startDate" TIMESTAMP NOT NULL DEFAULT now(), "endDate" TIMESTAMP, "lastSubscriptionDate" TIMESTAMP, "resetDate" TIMESTAMP, "isSubscriptionActive" boolean NOT NULL DEFAULT true, CONSTRAINT "REL_e7dfb1112dc2436d350d67f56d" UNIQUE ("userId"), CONSTRAINT "PK_bbff9d5e095f9c76cc66e78a951" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_e7dfb1112dc2436d350d67f56d" ON "user_plans" ("userId") `);
    await queryRunner.query(`CREATE INDEX "IDX_4846c2fbd62da9a99cb2f5146a" ON "user_plans" ("planId") `);
    await queryRunner.query(`ALTER TABLE "users" ADD "userPlanId" integer`);
    await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_bd33177d862e61ccc1ff42a26ff" UNIQUE ("userPlanId")`);
    await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_bd33177d862e61ccc1ff42a26ff" FOREIGN KEY ("userPlanId") REFERENCES "user_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "user_plan_usage" ADD CONSTRAINT "FK_fbb7e4af821bd7942c80367c926" FOREIGN KEY ("userPlanId") REFERENCES "user_plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "user_plan_usage" ADD CONSTRAINT "FK_aa4f8eb77cf6d662f952f22d825" FOREIGN KEY ("planFeaturePropertyId") REFERENCES "plan_feature_properties"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "user_plans" ADD CONSTRAINT "FK_e7dfb1112dc2436d350d67f56d7" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "user_plans" ADD CONSTRAINT "FK_4846c2fbd62da9a99cb2f5146a6" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_plans" DROP CONSTRAINT "FK_4846c2fbd62da9a99cb2f5146a6"`);
    await queryRunner.query(`ALTER TABLE "user_plans" DROP CONSTRAINT "FK_e7dfb1112dc2436d350d67f56d7"`);
    await queryRunner.query(`ALTER TABLE "user_plan_usage" DROP CONSTRAINT "FK_aa4f8eb77cf6d662f952f22d825"`);
    await queryRunner.query(`ALTER TABLE "user_plan_usage" DROP CONSTRAINT "FK_fbb7e4af821bd7942c80367c926"`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_bd33177d862e61ccc1ff42a26ff"`);
    await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_57de40bc620f456c7311aa3a1e6"`);
    await queryRunner.query(`ALTER TABLE "sessions" ALTER COLUMN "userId" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_57de40bc620f456c7311aa3a1e6" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_bd33177d862e61ccc1ff42a26ff"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "userPlanId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4846c2fbd62da9a99cb2f5146a"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e7dfb1112dc2436d350d67f56d"`);
    await queryRunner.query(`DROP TABLE "user_plans"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_aa4f8eb77cf6d662f952f22d82"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_fbb7e4af821bd7942c80367c92"`);
    await queryRunner.query(`DROP TABLE "user_plan_usage"`);
  }
}
