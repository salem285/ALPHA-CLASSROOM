import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './modules/prisma/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { CoursesModule } from './modules/courses/courses.module.js';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, CoursesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
