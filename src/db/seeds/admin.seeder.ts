import { DataSource, DataSourceOptions, Repository } from 'typeorm';
import { dataSourceOptions } from '../db-config';
import * as bcrypt from 'bcrypt';
import { Admin } from '@entities';

export class AdminSeeder {
  async run(): Promise<void> {
    const dataSource = new DataSource(dataSourceOptions as DataSourceOptions);
    await dataSource.initialize();
    const adminRepository: Repository<Admin> = dataSource.getRepository(Admin);

    const hashedPassword = await bcrypt.hash('healthtune@Admin123', 10);

    const adminUser = {
      firstName: 'System',
      lastName: 'Admin',
      email: 'healthtune.admin@yopmail.com',
      password: hashedPassword,
      isVerified: true,
      isActive: true,
    };

    const existingAdmin = await adminRepository.findOne({ where: { email: adminUser.email } });

    if (!existingAdmin) await adminRepository.save(adminUser);

    console.log('Admin seeded successfully');
  }
}
