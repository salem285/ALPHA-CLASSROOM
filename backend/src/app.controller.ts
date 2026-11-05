import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @SkipThrottle()
  @Get('health')
  async getHealth() {
    return await this.appService.getHealth();
  }

  @Get()
  getRoot() {
    return this.appService.getRoot();
  }
}
