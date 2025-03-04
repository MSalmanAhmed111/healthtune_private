import { MigrationInterface, QueryRunner } from "typeorm";

export class UserProfileImage1741083647196 implements MigrationInterface {
    name = 'UserProfileImage1741083647196'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "profileImage" integer`);
        await queryRunner.query(`ALTER TABLE "patients" ADD "profileImage" integer`);
   }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "patients" DROP COLUMN "profileImage"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "profileImage"`);
    }

}
