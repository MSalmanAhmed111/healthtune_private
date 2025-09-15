import { MigrationInterface, QueryRunner } from "typeorm";

export class AppointmentSessionLinking1757928018791 implements MigrationInterface {
    name = 'AppointmentSessionLinking1757928018791'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sessions" ADD "appointmentId" integer`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "UQ_8ceff81e44b84ed8221c44848f3" UNIQUE ("appointmentId")`);
        await queryRunner.query(`ALTER TABLE "appointment" ADD "isCompleted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_8ceff81e44b84ed8221c44848f3" FOREIGN KEY ("appointmentId") REFERENCES "appointment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_8ceff81e44b84ed8221c44848f3"`);
        await queryRunner.query(`ALTER TABLE "appointment" DROP COLUMN "isCompleted"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "UQ_8ceff81e44b84ed8221c44848f3"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN "appointmentId"`);
    }

}
