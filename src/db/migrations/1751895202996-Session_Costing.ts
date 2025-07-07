import { MigrationInterface, QueryRunner } from "typeorm";

export class SessionCosting1751895202996 implements MigrationInterface {
    name = 'SessionCosting1751895202996'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "session_costing" ("id" SERIAL NOT NULL, "totalInputTokens" integer NOT NULL, "totalOutputTokens" integer NOT NULL, "totalTokens" integer NOT NULL, "totalInputCost" character varying NOT NULL, "totalOutputCost" character varying NOT NULL, "totalSessionCost" character varying NOT NULL, "operations" text array NOT NULL, "sessionId" integer NOT NULL, CONSTRAINT "REL_0ef68c524f36c2a5a2e0290507" UNIQUE ("sessionId"), CONSTRAINT "PK_0b97782c80360a15235b714cf8d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD "sessionCostingId" integer`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "UQ_793241b29886c4aa5e503b2db6a" UNIQUE ("sessionCostingId")`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_793241b29886c4aa5e503b2db6a" FOREIGN KEY ("sessionCostingId") REFERENCES "session_costing"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "session_costing" ADD CONSTRAINT "FK_0ef68c524f36c2a5a2e02905073" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session_costing" DROP CONSTRAINT "FK_0ef68c524f36c2a5a2e02905073"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_793241b29886c4aa5e503b2db6a"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "UQ_793241b29886c4aa5e503b2db6a"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN "sessionCostingId"`);
        await queryRunner.query(`DROP TABLE "session_costing"`);
    }

}
