import { MigrationInterface, QueryRunner } from "typeorm";

export class Feedback1764849961294 implements MigrationInterface {
    name = 'Feedback1764849961294'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "session_feedback" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "feedback" text NOT NULL, "sessionId" integer NOT NULL, "userId" integer NOT NULL, CONSTRAINT "PK_5351647a4a00ccbca90adb057f6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "session_feedback" ADD CONSTRAINT "FK_a0567dbf6bd30cf4bd05b110a17" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "session_feedback" ADD CONSTRAINT "FK_a25e46d1702cb59bc8a7e57deac" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session_feedback" DROP CONSTRAINT "FK_a25e46d1702cb59bc8a7e57deac"`);
        await queryRunner.query(`ALTER TABLE "session_feedback" DROP CONSTRAINT "FK_a0567dbf6bd30cf4bd05b110a17"`);
        await queryRunner.query(`DROP TABLE "session_feedback"`);
    }

}
