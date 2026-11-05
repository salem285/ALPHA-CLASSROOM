import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './modules/prisma/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { CoursesModule } from './modules/courses/courses.module.js';
import { AssignmentsModule } from './modules/assignments/assignments.module.js';
import { ExamsModule } from './modules/exams/exams.module.js';
import { RoomsModule } from './modules/rooms/rooms.module.js';
import { RecordingsModule } from './modules/recordings/recordings.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { AnnouncementsModule } from './modules/announcements/announcements.module.js';
import { DiscussionsModule } from './modules/discussions/discussions.module.js';
import { MaterialsModule } from './modules/materials/materials.module.js';
import { CertificatesModule } from './modules/certificates/certificates.module.js';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    AssignmentsModule,
    ExamsModule,
    RoomsModule,
    RecordingsModule,
    NotificationsModule,
    AnnouncementsModule,
    DiscussionsModule,
    MaterialsModule,
    CertificatesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
