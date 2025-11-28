import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrgSubscription1764259491086 implements MigrationInterface {
    name = 'AddOrgSubscription1764259491086'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_plans" DROP CONSTRAINT "FK_e7dfb1112dc2436d350d67f56d7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e7dfb1112dc2436d350d67f56d"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "stripeCustomerId"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "stripeSubscriptiontId"`);
        await queryRunner.query(`ALTER TABLE "user_plans" ADD "subscriberType" character varying NOT NULL DEFAULT 'user'`);
        await queryRunner.query(`ALTER TABLE "user_plans" ADD "subscriberId" integer`);
        await queryRunner.query(`ALTER TABLE "user_plans" ADD "stripeCustomerId" character varying`);
        await queryRunner.query(`ALTER TABLE "user_plans" ADD CONSTRAINT "UQ_683da538d06696367f785534e0b" UNIQUE ("stripeCustomerId")`);
        await queryRunner.query(`ALTER TABLE "user_plans" ADD "stripeSubscriptionId" character varying`);
        await queryRunner.query(`ALTER TABLE "user_plans" ADD "cardAdded" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "user_plans" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "user_plans" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "organizations" ADD "userPlanId" integer`);
        await queryRunner.query(`ALTER TABLE "organizations" ADD CONSTRAINT "UQ_8d3cb82cffe5e715f599fc9c0c4" UNIQUE ("userPlanId")`);
        await queryRunner.query(`ALTER TABLE "user_plan_usage" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "user_plan_usage" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "subscription_history" ADD "subscriberType" character varying NOT NULL DEFAULT 'user'`);
        // First add subscriberId as nullable, then populate from userId, then add NOT NULL constraint
        await queryRunner.query(`ALTER TABLE "subscription_history" ADD "subscriberId" integer`);
        // Copy existing userId values to subscriberId for backward compatibility
        await queryRunner.query(`UPDATE "subscription_history" SET "subscriberId" = "userId" WHERE "subscriberId" IS NULL`);
        // Now make it NOT NULL
        await queryRunner.query(`ALTER TABLE "subscription_history" ALTER COLUMN "subscriberId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "subscription_history" ADD "organizationId" integer`);
        await queryRunner.query(`ALTER TABLE "user_plans" ALTER COLUMN "userId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_plans" DROP CONSTRAINT "REL_e7dfb1112dc2436d350d67f56d"`);
        await queryRunner.query(`ALTER TABLE "subscription_history" DROP CONSTRAINT "FK_bfbe390118678d2ce21103acfd7"`);
        await queryRunner.query(`ALTER TABLE "subscription_history" ALTER COLUMN "userId" DROP NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_a1805ec41c4d47923be4ae1b4e" ON "user_plans" ("subscriberId") `);
        await queryRunner.query(`CREATE INDEX "IDX_01e69b90b64c62d407e19db0aa" ON "user_plans" ("subscriberType", "subscriberId") `);
        await queryRunner.query(`CREATE INDEX "IDX_9166cb48f511688fc8916d2063" ON "subscription_history" ("subscriberType", "subscriberId") `);
        await queryRunner.query(`ALTER TABLE "organizations" ADD CONSTRAINT "FK_8d3cb82cffe5e715f599fc9c0c4" FOREIGN KEY ("userPlanId") REFERENCES "user_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscription_history" ADD CONSTRAINT "FK_bfbe390118678d2ce21103acfd7" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscription_history" ADD CONSTRAINT "FK_5d15f1f783f91b06f3f85250f56" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "subscription_history" DROP CONSTRAINT "FK_5d15f1f783f91b06f3f85250f56"`);
        await queryRunner.query(`ALTER TABLE "subscription_history" DROP CONSTRAINT "FK_bfbe390118678d2ce21103acfd7"`);
        await queryRunner.query(`ALTER TABLE "organizations" DROP CONSTRAINT "FK_8d3cb82cffe5e715f599fc9c0c4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9166cb48f511688fc8916d2063"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_01e69b90b64c62d407e19db0aa"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a1805ec41c4d47923be4ae1b4e"`);
        await queryRunner.query(`ALTER TABLE "subscription_history" ALTER COLUMN "userId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "subscription_history" ADD CONSTRAINT "FK_bfbe390118678d2ce21103acfd7" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_plans" ADD CONSTRAINT "REL_e7dfb1112dc2436d350d67f56d" UNIQUE ("userId")`);
        await queryRunner.query(`ALTER TABLE "user_plans" ALTER COLUMN "userId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "subscription_history" DROP COLUMN "organizationId"`);
        await queryRunner.query(`ALTER TABLE "subscription_history" DROP COLUMN "subscriberId"`);
        await queryRunner.query(`ALTER TABLE "subscription_history" DROP COLUMN "subscriberType"`);
        await queryRunner.query(`ALTER TABLE "user_plan_usage" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "user_plan_usage" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "organizations" DROP CONSTRAINT "UQ_8d3cb82cffe5e715f599fc9c0c4"`);
        await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN "userPlanId"`);
        await queryRunner.query(`ALTER TABLE "user_plans" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "user_plans" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "user_plans" DROP COLUMN "cardAdded"`);
        await queryRunner.query(`ALTER TABLE "user_plans" DROP COLUMN "stripeSubscriptionId"`);
        await queryRunner.query(`ALTER TABLE "user_plans" DROP CONSTRAINT "UQ_683da538d06696367f785534e0b"`);
        await queryRunner.query(`ALTER TABLE "user_plans" DROP COLUMN "stripeCustomerId"`);
        await queryRunner.query(`ALTER TABLE "user_plans" DROP COLUMN "subscriberId"`);
        await queryRunner.query(`ALTER TABLE "user_plans" DROP COLUMN "subscriberType"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "stripeSubscriptiontId" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "stripeCustomerId" character varying`);
        await queryRunner.query(`CREATE INDEX "IDX_e7dfb1112dc2436d350d67f56d" ON "user_plans" ("userId") `);
        await queryRunner.query(`ALTER TABLE "user_plans" ADD CONSTRAINT "FK_e7dfb1112dc2436d350d67f56d7" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
