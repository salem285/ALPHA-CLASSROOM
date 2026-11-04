"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { api, ApiError } from '@/lib/api';
import { User, UserRole } from '@/types/auth';
import {
  Shield,
  Users,
  UserCheck,
  UserX,
  LogOut,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  GraduationCap,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoadingData(true);
    try {
      const [pending, all] = await Promise.all([
        api.get<User[]>('/users/pending'),
        api.get<User[]>('/users'),
      ]);
      setPendingUsers(pending);
      setAllUsers(all);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setActionMessage({ type: 'error', text: `Failed to load users: ${err.message}` });
      }
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
        router.push(user.role === 'INSTRUCTOR' ? '/instructor' : '/student');
      } else {
        fetchUsers();
      }
    }
  }, [user, authLoading, router, fetchUsers]);

  const handleApprove = async (id: string, email: string) => {
    try {
      setActionMessage(null);
      await api.patch(`/users/${id}/approve`);
      setActionMessage({ type: 'success', text: `User ${email} was successfully approved!` });
      await fetchUsers();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Approval failed';
      setActionMessage({ type: 'error', text: msg });
    }
  };

  const handleReject = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to reject and remove applicant ${email}?`)) {
      return;
    }

    try {
      setActionMessage(null);
      await api.delete(`/users/${id}`);
      setActionMessage({ type: 'success', text: `Applicant ${email} was rejected and removed.` });
      await fetchUsers();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Rejection failed';
      setActionMessage({ type: 'error', text: msg });
    }
  };

  if (authLoading || (!user && !actionMessage)) {
    return (
      <div className="min-h-screen bg-[#090b14] flex items-center justify-center text-slate-300">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span>Verifying administrator credentials...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090b14] text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="border-b border-[#1c223c] bg-[#0e1224]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-extrabold text-white text-sm shadow-md">
                α
              </span>
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-purple-400 block -mb-1">
                  Alpha Coding
                </span>
                <span className="text-lg font-bold text-white tracking-tight">ALPHA CLASSROOM</span>
              </div>
            </Link>
            <span className="ml-3 hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-950/80 text-purple-300 border border-purple-800/60">
              <Shield className="w-3 h-3 text-purple-400" />
              {user?.role} Portal
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-200">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">{user?.email}</div>
            </div>
            <button
              onClick={logout}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-[#262e52] hover:bg-[#1a203a] text-xs font-medium text-slate-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Welcome & Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#12162b] border border-[#21294c] rounded-2xl p-5 shadow-lg flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">Total Users</div>
              <div className="text-2xl font-bold text-white mt-0.5">{allUsers.length}</div>
            </div>
          </div>

          <div className="bg-[#12162b] border border-[#21294c] rounded-2xl p-5 shadow-lg flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">Pending Approvals</div>
              <div className="text-2xl font-bold text-amber-300 mt-0.5">{pendingUsers.length}</div>
            </div>
          </div>

          <div className="bg-[#12162b] border border-[#21294c] rounded-2xl p-5 shadow-lg flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">Approved Users</div>
              <div className="text-2xl font-bold text-emerald-300 mt-0.5">
                {allUsers.filter((u) => u.isApproved).length}
              </div>
            </div>
          </div>
        </div>

        {/* Action feedback toast */}
        {actionMessage && (
          <div
            className={`p-4 rounded-xl border text-sm flex items-center justify-between ${
              actionMessage.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
            }`}
          >
            <span>{actionMessage.text}</span>
            <button
              onClick={() => setActionMessage(null)}
              className="text-xs font-bold px-2 py-0.5 hover:opacity-75 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Management Card */}
        <div className="bg-[#12162b] border border-[#21294c] rounded-2xl shadow-xl overflow-hidden">
          {/* Card Header & Tabs */}
          <div className="px-6 py-4 border-b border-[#21294c] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                  activeTab === 'pending'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
                    : 'text-slate-400 hover:text-white hover:bg-[#191f3a]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Pending Approvals ({pendingUsers.length})
              </button>

              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                  activeTab === 'all'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
                    : 'text-slate-400 hover:text-white hover:bg-[#191f3a]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                All Users ({allUsers.length})
              </button>
            </div>

            <button
              onClick={fetchUsers}
              disabled={loadingData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#262e52] hover:bg-[#1a203a] text-xs font-medium text-slate-300 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            {activeTab === 'pending' ? (
              pendingUsers.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400/60 mx-auto mb-3" />
                  <p className="font-semibold text-slate-200">No Pending Approvals</p>
                  <p className="text-xs text-slate-500 mt-1">
                    All user registration applications have been reviewed.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#1c223c] bg-[#0f1222] text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-6">Applicant</th>
                      <th className="py-3 px-6">Email</th>
                      <th className="py-3 px-6">Requested Role</th>
                      <th className="py-3 px-6">Registered On</th>
                      <th className="py-3 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a2038]">
                    {pendingUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-[#151932] transition">
                        <td className="py-4 px-6 font-medium text-white">
                          {u.firstName} {u.lastName}
                        </td>
                        <td className="py-4 px-6 font-mono text-slate-300">{u.email}</td>
                        <td className="py-4 px-6">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                            {u.role}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-400">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleApprove(u.id, u.email)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition flex items-center gap-1 cursor-pointer"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(u.id, u.email)}
                              className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-600/40 font-semibold transition flex items-center gap-1 cursor-pointer"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#1c223c] bg-[#0f1222] text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-6">User</th>
                    <th className="py-3 px-6">Email</th>
                    <th className="py-3 px-6">Role</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a2038]">
                  {allUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-[#151932] transition">
                      <td className="py-4 px-6 font-medium text-white">
                        {u.firstName} {u.lastName}
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-300">{u.email}</td>
                      <td className="py-4 px-6">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-950 text-purple-300 border border-purple-800/60">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {u.isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            Pending Review
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-400">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
