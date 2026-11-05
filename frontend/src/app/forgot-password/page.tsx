"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { Mail, ArrowLeft, CheckCircle2, ShieldAlert, KeyRound } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post<{ message: string }>('/auth/forgot-password', {
        email: email.trim(),
      });
      setMessage(
        res.message ||
          'If this email is registered, a password reset link has been dispatched. Check your inbox or local server console.',
      );
      setSubmitted(true);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to dispatch reset link. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#090b14] relative overflow-hidden text-slate-100">
      {/* Background ambient glow */}
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
            Recover access to your learning portal / استعادة كلمة المرور
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#121528] border border-[#232948] rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#1f2544]">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Forgot Password</h2>
              <p className="text-xs text-slate-400">
                Enter your verified email to receive a reset link
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl border border-rose-800/60 bg-rose-950/40 text-rose-200 text-sm flex gap-3 items-start">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
              <div>
                <p className="font-semibold text-xs">Error</p>
                <p className="text-xs mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {submitted ? (
            <div className="space-y-6">
              <div className="p-4 rounded-xl border border-emerald-800/60 bg-emerald-950/40 text-emerald-200 text-sm flex gap-3 items-start">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
                <div>
                  <p className="font-semibold text-xs">Reset Request Dispatched</p>
                  <p className="text-xs mt-1 leading-relaxed opacity-90">{message}</p>
                </div>
              </div>

              <div className="p-3 bg-[#0c0e1b] rounded-xl border border-[#252c4e] text-xs text-slate-400">
                💡 <span className="font-semibold text-slate-300">Development Note:</span> Since
                no external live SMTP is configured, check your backend server console for the generated
                reset URL and authentication token.
              </div>

              <div className="space-y-3">
                <Link
                  href="/login"
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-purple-900/30 transition flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Return to Sign In
                </Link>

                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="w-full text-center text-xs text-purple-400 hover:text-purple-300 hover:underline cursor-pointer"
                >
                  Try another email address
                </button>
              </div>
            </div>
          ) : (
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
                    placeholder="student@alphacoding.com"
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
                    <KeyRound className="w-4 h-4" />
                    Send Password Reset Link
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-purple-400 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
