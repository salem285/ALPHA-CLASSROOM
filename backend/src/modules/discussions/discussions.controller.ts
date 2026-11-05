import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { DiscussionsService } from './discussions.service.js';
import { CreateDiscussionPostDto } from './dto/create-discussion-post.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '@prisma/client';

@Controller('courses/:courseId/discussions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DiscussionsController {
  constructor(private readonly discussionsService: DiscussionsService) {}

  @Post()
  @Roles(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async create(
    @Param('courseId') courseId: string,
    @Body() dto: CreateDiscussionPostDto,
    @CurrentUser() user: any,
  ) {
    return this.discussionsService.create(courseId, dto, user.id, user.role);
  }

  @Get()
  @Roles(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async findByCourse(
    @Param('courseId') courseId: string,
    @CurrentUser() user: any,
  ) {
    return this.discussionsService.findByCourse(courseId, user.id, user.role);
  }
}
