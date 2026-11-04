import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Prisma connected successfully to PostgreSQL database.');
    } catch (error: unknown) {
      this.logger.warn(
        `Prisma database connection deferred: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma disconnected from PostgreSQL database.');
  }

  async isHealthy(): Promise<{ isConnected: boolean; error?: string }> {
    try {
      await this.$queryRaw`SELECT 1`;
      return { isConnected: true };
    } catch (error: unknown) {
      return {
        isConnected: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
