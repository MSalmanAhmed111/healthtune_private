import { MigrationInterface, QueryRunner } from "typeorm";

export class AppointmentUpdt1741115809143 implements MigrationInterface {
    name = 'AppointmentUpdt1741115809143'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointment" ADD "color" character varying(10)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointment" DROP COLUMN "color"`);
    }

}
