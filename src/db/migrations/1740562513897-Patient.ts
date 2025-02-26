import { MigrationInterface, QueryRunner } from 'typeorm';

export class Patient1740562513897 implements MigrationInterface {
  name = 'Patient1740562513897';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "patients" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "mreNumber" character varying NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "email" character varying, "dateOfBirth" date, "gender" character varying, "maritalStatus" character varying, "nationality" character varying, "occupation" character varying, "addressStreetaddress" character varying(150), "addressCity" character varying, "addressArea" character varying, "addressPostalcode" character varying, "addressCountry" character varying, "contactDetailsPhonenumber" character varying, "contactDetailsEmergencycontactname" character varying, "contactDetailsEmergencycontactrelationship" character varying, "contactDetailsEmergencycontactphone" character varying, "medicalDetailsBloodtype" character varying, "medicalDetailsMedicalhistory" text, "medicalDetailsAllergies" text, "medicalDetailsCurrentmedications" text, "medicalDetailsChronicdiseases" text, "medicalDetailsSurgicalhistory" text, "medicalDetailsIssmoker" boolean NOT NULL DEFAULT false, "medicalDetailsIsalcoholic" boolean NOT NULL DEFAULT false, "insuranceDetailsIsinsured" boolean NOT NULL DEFAULT false, "insuranceDetailsInsuranceprovider" character varying, "insuranceDetailsInsurancepolicynumber" character varying, "insuranceDetailsInsuranceexpirydate" date, "admissionDetailsIsdischarged" boolean, "admissionDetailsAdmissionreason" text, "admissionDetailsRoomnumber" character varying, "admissionDetailsAdmissiondate" date, "admissionDetailsDischargedate" date, CONSTRAINT "UQ_005394a6378c69c1730b8f8894c" UNIQUE ("mreNumber"), CONSTRAINT "UQ_64e2031265399f5690b0beba6a5" UNIQUE ("email"), CONSTRAINT "PK_a7f0b9fcbb3469d5ec0b0aceaa7" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "patients"`);
  }
}
