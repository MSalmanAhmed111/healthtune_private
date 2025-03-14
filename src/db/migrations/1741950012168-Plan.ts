import { MigrationInterface, QueryRunner } from 'typeorm';

export class Plan1741950012168 implements MigrationInterface {
  name = 'Plan1741950012168';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "plan_features" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "module" character varying NOT NULL, "defaultProperties" jsonb, CONSTRAINT "UQ_0f6225ee150034397941c549203" UNIQUE ("name"), CONSTRAINT "PK_eb2b32d1d93a8b2e96e122e3a77" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE TABLE "plans" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" text, "price" character varying NOT NULL, "planType" character varying NOT NULL, CONSTRAINT "PK_3720521a81c7c24fe9b7202ba61" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "plan_feature_properties" ("id" SERIAL NOT NULL, "displayName" character varying, "description" text, "featureId" integer NOT NULL, "properties" jsonb NOT NULL, "planId" integer, CONSTRAINT "PK_eb2fb714e8b10267d52adeb4781" PRIMARY KEY ("id"))`);
    await queryRunner.query(`ALTER TABLE "plan_feature_properties" ADD CONSTRAINT "FK_ffe97972dcc015d1b0ad134d139" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "plan_feature_properties" ADD CONSTRAINT "FK_7a73e56f074331afdd2e76c8cbd" FOREIGN KEY ("featureId") REFERENCES "plan_features"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "plan_feature_properties" DROP CONSTRAINT "FK_7a73e56f074331afdd2e76c8cbd"`);
    await queryRunner.query(`ALTER TABLE "plan_feature_properties" DROP CONSTRAINT "FK_ffe97972dcc015d1b0ad134d139"`);
    await queryRunner.query(`DROP TABLE "plan_feature_properties"`);
    await queryRunner.query(`DROP TABLE "plans"`);
    await queryRunner.query(`DROP TABLE "plan_features"`);
  }
}
