"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { NotificationItem, NotificationsResponse } from '@/types/notification';
import {
  Bell,
  Check,
  Megaphone,
  Radio,
  FileText,
  CheckSquare,
  MessageSquare,
  Info,
  Clock,
  ExternalLink,
} from 'lucide-react';

export default function NotificationsPopover() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api.get<NotificationsResponse>('/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // Silently handle if unauthenticated or network failure
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (item: NotificationItem) => {
    if (!item.isRead) {
      try {
        await api.patch(`/notifications/${item.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // ignore
      }
    }

    if (item.link) {
      setIsOpen(false);
      router.push(item.link);
    }
  };

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'ANNOUNCEMENT':
        return <Megaphone className="w-4 h-4 text-purple-400" />;
      case 'LIVE_SESSION':
        return <Radio className="w-4 h-4 text-rose-400 animate-pulse" />;
      case 'ASSIGNMENT':
        return <FileText className="w-4 h-4 text-indigo-400" />;
      case 'EXAM':
        return <CheckSquare className="w-4 h-4 text-amber-400" />;
      case 'DISCUSSION_REPLY':
      case 'DISCUSSION_QUESTION':
        return <MessageSquare className="w-4 h-4 text-teal-400" />;
      default:
        return <Info className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 rounded-xl border border-[#262e52] hover:bg-[#1a203a] text-slate-300 hover:text-white transition flex items-center justify-center cursor-pointer"
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-extrabold text-white animate-pulse shadow-md shadow-rose-900/50">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#12162b] border border-[#2a345e] shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 px-4 bg-[#0e1224] border-b border-[#21294c] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-xs tracking-wide">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800/60">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={loading}
                className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
              >
                <Check className="w-3 h-3" />
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#1a203a]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-300">No notifications yet</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Updates on lectures, assignments, and exams will appear here.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleMarkAsRead(item)}
                  className={`p-3 px-4 transition cursor-pointer flex items-start gap-3 hover:bg-[#181e3d] ${
                    !item.isRead ? 'bg-[#151b38]/60' : 'bg-transparent'
                  }`}
                >
                  <div className="mt-0.5 p-2 rounded-xl bg-[#0b0e1b] border border-[#232c52] shrink-0">
                    {getIconForType(item.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h5
                        className={`text-xs truncate ${
                          !item.isRead ? 'font-bold text-white' : 'font-medium text-slate-300'
                        }`}
                      >
                        {item.title}
                      </h5>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                      <Clock className="w-3 h-3 text-slate-600" />
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      <span>&bull;</span>
                      <span>
                        {new Date(item.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
