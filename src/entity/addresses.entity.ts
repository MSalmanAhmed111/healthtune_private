import { Column } from 'typeorm';

export class Address {
  @Column({ type: 'varchar', length: 150, nullable: true, default: null })
  streetAddress: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  city: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  area: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  postalCode: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  country: string;
}

export class LongLatAddress extends Address {
  @Column({ type: 'decimal', precision: 10, scale: 6, default: null })
  longitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, default: null })
  latitude: number;
}
