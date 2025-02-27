import { MigrationInterface, QueryRunner } from "typeorm";

export class Appointment1740654829014 implements MigrationInterface {
    name = 'Appointment1740654829014'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "appointment" ("id" SERIAL NOT NULL, "patientId" integer NOT NULL, "doctorId" integer, "appointmentDate" TIMESTAMP NOT NULL, "status" character varying(50) NOT NULL DEFAULT 'Scheduled', "reasonForVisit" text, "notes" text, "appointmentType" character varying(20), "consultationFee" numeric(10,2), "location" character varying(100), "isTelemedicine" boolean NOT NULL DEFAULT false, "roomNumber" character varying(50), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e8be1a53027415e709ce8a2db74" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "appointment"`);
    }

}
