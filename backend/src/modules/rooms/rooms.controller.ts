import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { RoomsService } from './rooms.service.js';
import { CreateRoomDto } from './dto/create-room.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '@prisma/client';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post('courses/:courseId/rooms')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async create(
    @Param('courseId') courseId: string,
    @Body() dto: CreateRoomDto,
    @CurrentUser() user: any,
  ) {
    return this.roomsService.create(courseId, dto, user.id, user.role);
  }

  @Get('courses/:courseId/rooms/active')
  @Roles(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async findActiveByCourse(
    @Param('courseId') courseId: string,
    @CurrentUser() user: any,
  ) {
    return this.roomsService.findActiveByCourse(courseId, user.id, user.role);
  }

  @Get('rooms/:roomId/token')
  @Roles(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getToken(
    @Param('roomId') roomId: string,
    @CurrentUser() user: any,
  ) {
    return this.roomsService.generateToken(roomId, user);
  }

  @Patch('rooms/:roomId/end')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async endRoom(
    @Param('roomId') roomId: string,
    @CurrentUser() user: any,
  ) {
    return this.roomsService.endRoom(roomId, user.id, user.role);
  }

  @Get('rooms/:roomId')
  @Roles(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getRoom(@Param('roomId') roomId: string) {
    return this.roomsService.findById(roomId);
  }
}
