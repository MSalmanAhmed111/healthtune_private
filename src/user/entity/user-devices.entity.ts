import { Entity, Column, ManyToOne, Unique } from 'typeorm';
import { BaseEntity, User } from 'src/entity';

@Entity({ name: 'user_devices' })
export class UserDevices extends BaseEntity {
  @Unique(['userId', 'deviceId'])
  @ManyToOne(() => User, (user) => user.userDevices)
  user: User;

  @Column()
  userId: number;

  @Column({ type: 'varchar', nullable: true })
  fcmToken: string;

  @Column({ type: 'varchar' })
  deviceId: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
