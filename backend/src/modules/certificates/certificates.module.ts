import { Module } from '@nestjs/common';
import { CertificatesService } from './certificates.service.js';
import { CertificatesController } from './certificates.controller.js';
import { CoursesModule } from '../courses/courses.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [CoursesModule, AuthModule],
  controllers: [CertificatesController],
  providers: [CertificatesService],
  exports: [CertificatesService],
})
export class CertificatesModule {}
