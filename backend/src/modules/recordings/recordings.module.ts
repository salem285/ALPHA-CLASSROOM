import { Module } from '@nestjs/common';
import { RecordingsService } from './recordings.service.js';
import { RecordingsController } from './recordings.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [RecordingsController],
  providers: [RecordingsService],
  exports: [RecordingsService],
})
export class RecordingsModule {}
