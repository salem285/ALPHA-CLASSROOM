import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationsService } from './notifications.service.js';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      notification: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        createMany: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
    };

    service = new NotificationsService(mockPrisma as any);
  });

  describe('getUserNotifications', () => {
    it('should return notifications list and unread count', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([
        { id: 'notif-1', title: 'New Announcement', isRead: false },
      ]);
      mockPrisma.notification.count.mockResolvedValue(1);

      const result = await service.getUserNotifications('user-1');

      expect(result.notifications).toHaveLength(1);
      expect(result.unreadCount).toBe(1);
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });
  });

  describe('markAsRead', () => {
    it('should throw NotFoundException if notification does not exist', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue(null);

      await expect(service.markAsRead('notif-99', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own notification', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue({
        id: 'notif-1',
        userId: 'other-user',
      });

      await expect(service.markAsRead('notif-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });

    it('should mark notification as read', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
        isRead: false,
      });
      mockPrisma.notification.update.mockResolvedValue({
        id: 'notif-1',
        isRead: true,
      });

      const result = await service.markAsRead('notif-1', 'user-1');
      expect(result.isRead).toBe(true);
      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { isRead: true },
      });
    });
  });

  describe('markAllAsRead', () => {
    it('should update all unread notifications for user', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.markAllAsRead('user-1');
      expect(result.updatedCount).toBe(5);
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRead: false },
        data: { isRead: true },
      });
    });
  });

  describe('createBatchNotifications', () => {
    it('should create notifications for multiple users', async () => {
      mockPrisma.notification.createMany.mockResolvedValue({ count: 2 });

      const result = await service.createBatchNotifications(
        ['u1', 'u2'],
        'Class Alert',
        'Lecture begins in 10 minutes',
        'LIVE_SESSION',
        '/classroom/1',
      );

      expect(result).toEqual({ count: 2 });
      expect(mockPrisma.notification.createMany).toHaveBeenCalled();
    });
  });
});
