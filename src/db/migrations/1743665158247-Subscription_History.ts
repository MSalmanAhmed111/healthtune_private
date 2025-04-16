import { MigrationInterface, QueryRunner } from "typeorm";

export class SubscriptionHistory1743665158247 implements MigrationInterface {
    name = 'SubscriptionHistory1743665158247'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "subscription_history" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "planId" integer, "subscriptionDate" TIMESTAMP NOT NULL DEFAULT now(), "endDate" TIMESTAMP, "isActive" boolean NOT NULL DEFAULT true, "status" character varying NOT NULL DEFAULT 'Subscribed', "paymentMethod" character varying NOT NULL DEFAULT 'Credit Card', "amountPaid" numeric(10,2), "transactionId" character varying, CONSTRAINT "PK_91a0ee8b462f23bfb2ad7924754" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "subscription_history" ADD CONSTRAINT "FK_bfbe390118678d2ce21103acfd7" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscription_history" ADD CONSTRAINT "FK_dbc75c9685c1eb99bfba202bb14" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "subscription_history" DROP CONSTRAINT "FK_dbc75c9685c1eb99bfba202bb14"`);
        await queryRunner.query(`ALTER TABLE "subscription_history" DROP CONSTRAINT "FK_bfbe390118678d2ce21103acfd7"`);
        await queryRunner.query(`DROP TABLE "subscription_history"`);
    }

}
