import { MigrationInterface, QueryRunner } from "typeorm";

export class Sessions1737631611661 implements MigrationInterface {
    name = 'Sessions1737631611661'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "sessions" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "patientName" character varying NOT NULL, "sex" character varying, "sessionType" character varying, "noteFormat" character varying, "language" character varying, "status" character varying NOT NULL DEFAULT 'Process', "transcriptId" integer, "noteId" integer, CONSTRAINT "REL_6abc0cd0374b6efc1c7ce632d4" UNIQUE ("transcriptId"), CONSTRAINT "REL_b79ce25ac276cb3c072004a8ad" UNIQUE ("noteId"), CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "notes" ("id" SERIAL NOT NULL, "sessionId" integer NOT NULL, "content" jsonb NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_5db6f7afaaa5bcf9793c4b4a60" UNIQUE ("sessionId"), CONSTRAINT "PK_af6206538ea96c4e77e9f400c3d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "transcripts" ("id" SERIAL NOT NULL, "sessionId" integer NOT NULL, "assemblyId" character varying(255) NOT NULL, "content" jsonb NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_5cfe0c31775f86437c230f1558" UNIQUE ("sessionId"), CONSTRAINT "PK_40c75f89c1fc953cd33e702247d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_6abc0cd0374b6efc1c7ce632d45" FOREIGN KEY ("transcriptId") REFERENCES "transcripts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_b79ce25ac276cb3c072004a8ad0" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notes" ADD CONSTRAINT "FK_5db6f7afaaa5bcf9793c4b4a602" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transcripts" ADD CONSTRAINT "FK_5cfe0c31775f86437c230f15583" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transcripts" DROP CONSTRAINT "FK_5cfe0c31775f86437c230f15583"`);
        await queryRunner.query(`ALTER TABLE "notes" DROP CONSTRAINT "FK_5db6f7afaaa5bcf9793c4b4a602"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_b79ce25ac276cb3c072004a8ad0"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_6abc0cd0374b6efc1c7ce632d45"`);
        await queryRunner.query(`DROP TABLE "transcripts"`);
        await queryRunner.query(`DROP TABLE "notes"`);
        await queryRunner.query(`DROP TABLE "sessions"`);
    }

}
