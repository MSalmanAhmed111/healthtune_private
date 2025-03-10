import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity('plan_features')
export class PlanFeature {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'jsonb', nullable: true })
  defaultProperties: Record<string, any>;
}
