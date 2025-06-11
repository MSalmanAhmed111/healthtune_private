import { Module } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, UserDevices } from 'src/entity';

@Module({
    imports: [TypeOrmModule.forFeature([User, UserDevices])],
    providers: [FirebaseService],
    exports: [FirebaseService],
})
export class FirebaseModule { }