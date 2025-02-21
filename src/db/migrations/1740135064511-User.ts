import { MigrationInterface, QueryRunner } from "typeorm";

export class User1740135064511 implements MigrationInterface {
    name = 'User1740135064511'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "clerkUserId" character varying NOT NULL, "email" character varying NOT NULL, "firstName" character varying, "lastName" character varying, "username" character varying, "imageUrl" character varying, "banned" boolean NOT NULL DEFAULT false, "passwordEnabled" boolean NOT NULL DEFAULT true, "twoFactorEnabled" boolean NOT NULL DEFAULT false, "primaryEmailAddressId" character varying, "publicMetadata" jsonb, "privateMetadata" jsonb, "unsafeMetadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_2530170f5916a86260a173b08ae" UNIQUE ("clerkUserId"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD "userId" integer`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_57de40bc620f456c7311aa3a1e6" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_57de40bc620f456c7311aa3a1e6"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN "userId"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
