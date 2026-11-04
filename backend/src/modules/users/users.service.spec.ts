import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UsersService } from './users.service.js';
import { UserRole } from '@prisma/client';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('UsersService', () => {
  let usersService: UsersService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };

    usersService = new UsersService(mockPrisma as any);
  });

  describe('findAll and findPending', () => {
    it('should query prisma with correct filter parameters', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        { id: '1', email: 'test1@alphacoding.com', isApproved: false, role: UserRole.STUDENT },
      ]);

      const result = await usersService.findPending();
      expect(result).toHaveLength(1);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isApproved: false },
        }),
      );
    });
  });

  describe('approveUser', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(usersService.approveUser('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user is already approved', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@alphacoding.com',
        isApproved: true,
      });

      await expect(usersService.approveUser('user-1')).rejects.toThrow(BadRequestException);
    });

    it('should update isApproved to true and return updated user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-2',
        email: 'applicant@alphacoding.com',
        isApproved: false,
      });

      mockPrisma.user.update.mockResolvedValue({
        id: 'user-2',
        email: 'applicant@alphacoding.com',
        isApproved: true,
        role: UserRole.STUDENT,
      });

      const updated = await usersService.approveUser('user-2');
      expect(updated.isApproved).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-2' },
        data: { isApproved: true },
        select: expect.any(Object),
      });
    });
  });

  describe('rejectUser', () => {
    it('should delete the user and return confirmation', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-3',
        email: 'bad@alphacoding.com',
      });
      mockPrisma.user.delete.mockResolvedValue({ id: 'user-3' });

      const res = await usersService.rejectUser('user-3');
      expect(res.rejectedUserId).toBe('user-3');
      expect(res.message).toContain('bad@alphacoding.com');
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-3' } });
    });
  });
});
