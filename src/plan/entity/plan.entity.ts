import { PlanFeatureProperty } from "@entities";
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  price: number;

  @Column({ type: 'varchar' }) // Can be enum if necessary
  planType: string;

  @OneToMany(() => PlanFeatureProperty, (featureProperty) => featureProperty.plan, { cascade: true })
  features: PlanFeatureProperty[];
}