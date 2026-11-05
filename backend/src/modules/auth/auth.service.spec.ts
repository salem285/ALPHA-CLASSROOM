import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service.js';
import { UserRole } from '@prisma/client';
import {
  ForbiddenException,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let authService: AuthService;
  let mockPrisma: any;
  let mockJwtService: any;
  let mockMailService: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      passwordResetToken: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
      $transaction: vi.fn().mockImplementation(async (arg) => {
        if (typeof arg === 'function') {
          return arg(mockPrisma);
        }
        return Array.isArray(arg) ? Promise.all(arg) : arg;
      }),
    };

    mockJwtService = {
      signAsync: vi.fn().mockResolvedValue('mock_jwt_token_xyz'),
    };

    mockMailService = {
      sendPasswordResetEmail: vi.fn().mockResolvedValue(true),
    };

    authService = new AuthService(
      mockPrisma as any,
      mockJwtService as any,
      mockMailService as any,
    );
  });

  describe('register', () => {
    it('should throw ConflictException if user already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'existing@alphacoding.com' });

      await expect(
        authService.register({
          email: 'existing@alphacoding.com',
          password: 'Password123!',
          firstName: 'John',
          lastName: 'Doe',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create user with isApproved=false and default role STUDENT', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockImplementation(({ data }: any) =>
        Promise.resolve({
          id: 'user-123',
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
          isApproved: data.isApproved,
          createdAt: new Date(),
        }),
      );

      const result = await authService.register({
        email: 'newstudent@alphacoding.com',
        password: 'Password123!',
        firstName: 'Jane',
        lastName: 'Doe',
      });

      expect(result.user.isApproved).toBe(false);
      expect(result.user.role).toBe(UserRole.STUDENT);
      expect(result.message).toContain('pending administrator approval');
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'unknown@alphacoding.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException if user is not approved', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'unapproved@alphacoding.com',
        password: hashedPassword,
        isApproved: false,
        role: UserRole.STUDENT,
      });

      await expect(
        authService.login({
          email: 'unapproved@alphacoding.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return accessToken when credentials are valid and user is approved', async () => {
      const hashedPassword = await bcrypt.hash('AdminPassword123!', 10);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@alphacoding.com',
        password: hashedPassword,
        firstName: 'Alpha',
        lastName: 'Admin',
        role: UserRole.SUPER_ADMIN,
        isApproved: true,
        createdAt: new Date(),
      });

      const result = await authService.login({
        email: 'admin@alphacoding.com',
        password: 'AdminPassword123!',
      });

      expect(result.accessToken).toBe('mock_jwt_token_xyz');
      expect(result.user.email).toBe('admin@alphacoding.com');
      expect(result.user.role).toBe(UserRole.SUPER_ADMIN);
      expect(result.user.isApproved).toBe(true);
    });
  });

  describe('forgotPassword', () => {
    it('should return 200 message without sending email if user does not exist (anti-enumeration)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const res = await authService.forgotPassword({ email: 'nonexistent@alphacoding.com' });
      expect(res.message).toContain('If this email is registered');
      expect(mockMailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should create token and send reset email when user exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-reset-1',
        email: 'student@alphacoding.com',
        firstName: 'Alpha',
      });
      mockPrisma.passwordResetToken.create.mockResolvedValue({
        id: 'token-1',
        token: 'reset-token-xyz',
      });

      const res = await authService.forgotPassword({ email: 'student@alphacoding.com' });
      expect(res.message).toContain('If this email is registered');
      expect(mockPrisma.passwordResetToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-reset-1',
          token: expect.any(String),
        }),
      });
      expect(mockMailService.sendPasswordResetEmail).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should throw BadRequestException if token is not found', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue(null);

      await expect(
        authService.resetPassword({
          token: 'invalid-token',
          newPassword: 'NewPassword123!',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if token is already used or expired', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'tok-1',
        token: 'used-token',
        used: true,
        expiresAt: new Date(Date.now() + 60000),
        user: { id: 'u1' },
      });

      await expect(
        authService.resetPassword({
          token: 'used-token',
          newPassword: 'NewPassword123!',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update user password and mark token as used', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'tok-2',
        token: 'valid-token',
        used: false,
        expiresAt: new Date(Date.now() + 600000), // 10 minutes from now
        userId: 'u1',
        user: { id: 'u1', email: 'test@alphacoding.com' },
      });

      const res = await authService.resetPassword({
        token: 'valid-token',
        newPassword: 'BrandNewPassword123!',
      });

      expect(res.message).toContain('successfully');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { password: expect.any(String) },
      });
    });
  });
});
