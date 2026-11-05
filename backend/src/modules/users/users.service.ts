import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { join } from 'node:path';
import { existsSync, unlinkSync } from 'node:fs';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { UserRole } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(role?: UserRole, isApproved?: boolean) {
    const whereClause: any = {};

    if (role) {
      whereClause.role = role;
    }

    if (isApproved !== undefined) {
      whereClause.isApproved = isApproved;
    }

    return this.prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isApproved: true,
        avatarUrl: true,
        phoneNumber: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findPending() {
    return this.findAll(undefined, false);
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isApproved: true,
        avatarUrl: true,
        phoneNumber: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    return user;
  }

  async approveUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    if (user.isApproved) {
      throw new BadRequestException(`User ${user.email} is already approved.`);
    }

    return this.prisma.user.update({
      where: { id },
      data: { isApproved: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isApproved: true,
        avatarUrl: true,
        phoneNumber: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async rejectUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return {
      message: `User applicant ${user.email} was successfully rejected and removed.`,
      rejectedUserId: id,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName.trim() }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName.trim() }),
        ...(dto.phoneNumber !== undefined && { phoneNumber: dto.phoneNumber.trim() }),
        ...(dto.bio !== undefined && { bio: dto.bio.trim() }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isApproved: true,
        avatarUrl: true,
        phoneNumber: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateAvatar(userId: string, filename: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    // Clean up old custom avatar file if present
    if (user.avatarUrl && user.avatarUrl.startsWith('/uploads/avatars/')) {
      const oldFilename = user.avatarUrl.replace('/uploads/avatars/', '');
      const oldPath = join(process.cwd(), 'uploads', 'avatars', oldFilename);
      try {
        if (existsSync(oldPath)) {
          unlinkSync(oldPath);
        }
      } catch {
        // Ignore deletion errors for missing legacy files
      }
    }

    const avatarUrl = `/uploads/avatars/${filename}`;

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isApproved: true,
        avatarUrl: true,
        phoneNumber: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: 'Avatar updated successfully',
      avatarUrl,
      user: updatedUser,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Current password does not match.');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return {
      message: 'Password changed successfully',
    };
  }
}
