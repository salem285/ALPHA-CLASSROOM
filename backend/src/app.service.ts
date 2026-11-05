import { Injectable } from '@nestjs/common';
import { PrismaService } from './modules/prisma/prisma.service.js';

@Injectable()
export class AppService {
  private readonly startTime = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  async getHealth() {
    const dbStatus = await this.prisma.isHealthy();
    const isUp = dbStatus.isConnected;

    return {
      status: isUp ? 'ok' : 'degraded',
      service: 'ALPHA CLASSROOM Backend API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      database: {
        status: isUp ? 'up' : 'down',
        connected: isUp,
        provider: 'postgresql',
        ...(dbStatus.error ? { message: dbStatus.error } : {}),
      },
    };
  }

  getRoot() {
    return {
      name: 'ALPHA CLASSROOM API',
      status: 'active',
      version: '1.0.0',
    };
  }
}
