import { Appointment, User } from '@entities';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { AppointmentStatus } from '@types';
import moment from 'moment';
import { FirebaseService } from 'src/firebase/firebase.service';
import { Repository, Between } from 'typeorm';

@Injectable()
export class AppointmentReminderJob {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly firebaseService: FirebaseService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleReminderCron() {
    const now = moment.utc();
    const twelveHoursLater = now.clone().add(12, 'hours');

    const upcomingAppointments = await this.appointmentRepo.find({
      where: {
        appointmentDate: Between(now.toDate(), twelveHoursLater.toDate()),
        status: AppointmentStatus.Scheduled,
      },
    });

    if (!upcomingAppointments.length) return;

    const uniqueDoctorIds: number[] = [...new Set(upcomingAppointments.map((a: Appointment) => a.doctorId))].filter(Boolean) as number[];

    const title = 'Upcoming Appointment Reminder';
    const message = 'You have appointments scheduled within the next 12 hours.';

    await this.firebaseService.sendNotification(uniqueDoctorIds, title, message);

    console.log(`Sent notifications to ${uniqueDoctorIds.length} doctors for ${upcomingAppointments.length} appointments`);
  }
}
