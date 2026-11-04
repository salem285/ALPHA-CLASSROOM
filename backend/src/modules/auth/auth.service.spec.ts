import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service.js';
import { UserRole } from '@prisma/client';
import { ForbiddenException, UnauthorizedException, ConflictException } from '@nestjs/common';

describe('AuthService', () => {
  let authService: AuthService;
  let mockPrisma: any;
  let mockJwtService: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    };

    mockJwtService = {
      signAsync: vi.fn().mockResolvedValue('mock_jwt_token_xyz'),
    };

    authService = new AuthService(mockPrisma as any, mockJwtService as any);
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
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.default.hash('Password123!', 10);

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
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.default.hash('AdminPassword123!', 10);

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
});
