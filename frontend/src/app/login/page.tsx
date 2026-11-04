"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { ApiError } from '@/lib/api';
import { LogIn, Lock, Mail, ShieldAlert, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPendingApproval, setIsPendingApproval] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsPendingApproval(false);
    setLoading(true);

    try {
      const user = await login(email, password);
      // Route based on role
      if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
        router.push('/admin');
      } else if (user.role === 'INSTRUCTOR') {
        router.push('/instructor');
      } else {
        router.push('/student');
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.statusCode === 403 && err.message.toLowerCase().includes('pending')) {
          setIsPendingApproval(true);
          setError(err.message);
        } else {
          setError(err.message);
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#090b14] relative overflow-hidden">
      {/* Background ambient glow matching Alpha Coding theme */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-xs uppercase tracking-widest font-bold text-purple-400">
              Alpha Coding
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mt-1">
              ALPHA CLASSROOM
            </h1>
          </Link>
          <p className="text-slate-400 text-sm mt-2">
            Sign in to access your educational workspace
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#121528] border border-[#232948] rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
          {error && (
            <div
              className={`mb-6 p-4 rounded-xl border text-sm flex gap-3 items-start ${
                isPendingApproval
                  ? 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                  : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
              }`}
            >
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-current" />
              <div>
                <p className="font-semibold">
                  {isPendingApproval ? 'Approval Required' : 'Authentication Error'}
                </p>
                <p className="mt-1 text-xs opacity-90">{error}</p>
                {isPendingApproval && (
                  <Link
                    href={`/pending-approval?email=${encodeURIComponent(email)}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 hover:underline mt-2"
                  >
                    View application status <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@alphacoding.com"
                  className="w-full bg-[#0c0e1b] border border-[#252c4e] rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0c0e1b] border border-[#252c4e] rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-purple-900/30 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Quick Auto-fill Credentials for Demo / Testing */}
          <div className="mt-6 pt-5 border-t border-[#1f2544] text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-300">Quick Sign-In Demo Accounts:</span>
              <span className="font-mono text-[10px] text-purple-400 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/40">
                Alpha@2026!
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between bg-[#0b0e1b] px-2.5 py-1.5 rounded-lg border border-[#1f2544] text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-300 text-[10px] font-bold">Admin</span>
                  <span className="font-mono text-slate-300">admin@alphacoding.com</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@alphacoding.com');
                    setPassword('Alpha@2026!');
                  }}
                  className="text-purple-400 hover:text-purple-300 hover:underline font-semibold cursor-pointer"
                >
                  Auto-fill
                </button>
              </div>

              <div className="flex items-center justify-between bg-[#0b0e1b] px-2.5 py-1.5 rounded-lg border border-[#1f2544] text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-indigo-900/60 text-indigo-300 text-[10px] font-bold">Instructor</span>
                  <span className="font-mono text-slate-300">instructor@alphacoding.com</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('instructor@alphacoding.com');
                    setPassword('Alpha@2026!');
                  }}
                  className="text-indigo-400 hover:text-indigo-300 hover:underline font-semibold cursor-pointer"
                >
                  Auto-fill
                </button>
              </div>

              <div className="flex items-center justify-between bg-[#0b0e1b] px-2.5 py-1.5 rounded-lg border border-[#1f2544] text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 text-[10px] font-bold">Student</span>
                  <span className="font-mono text-slate-300">student@alphacoding.com</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('student@alphacoding.com');
                    setPassword('Alpha@2026!');
                  }}
                  className="text-emerald-400 hover:text-emerald-300 hover:underline font-semibold cursor-pointer"
                >
                  Auto-fill
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-center text-sm text-slate-400 mt-6">
          Don&apos;t have an account yet?{' '}
          <Link href="/register" className="text-purple-400 hover:text-purple-300 font-semibold underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
