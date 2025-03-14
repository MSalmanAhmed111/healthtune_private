import { BaseFeatureProperties, ModuleEnum } from "@types";
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity('plan_features')
export class PlanFeature {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true })
  name: string;

  @Column({ type: 'varchar' })
  module: ModuleEnum;

  @Column({ type: 'jsonb', nullable: true })
  defaultProperties: BaseFeatureProperties;
}
