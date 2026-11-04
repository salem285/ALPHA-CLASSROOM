"use client";

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Clock, CheckCircle2, Shield, ArrowLeft, LogIn } from 'lucide-react';

function PendingApprovalContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  return (
    <div className="w-full max-w-lg bg-[#121528] border border-[#232948] rounded-2xl p-8 shadow-2xl backdrop-blur-sm text-center relative z-10">
      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
        <Clock className="w-8 h-8 animate-pulse" />
      </div>

      <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/60 mb-3">
        Account Status: Pending Approval
      </div>

      <h1 className="text-2xl font-bold text-white mb-2">
        Application Submitted Successfully
      </h1>

      <p className="text-slate-300 text-sm leading-relaxed mb-6">
        Thank you for registering with <strong className="text-purple-400">ALPHA CLASSROOM</strong>.
        {email && (
          <span className="block mt-2 font-mono text-xs text-slate-400 bg-[#0c0e1b] py-1.5 px-3 rounded-lg border border-[#232948]">
            {email}
          </span>
        )}
      </p>

      <div className="p-4 rounded-xl bg-[#0b0e1b] border border-[#212745] text-left text-xs text-slate-400 space-y-3 mb-8">
        <div className="flex gap-2.5 items-start">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>Your registration details were safely stored in the platform database.</span>
        </div>
        <div className="flex gap-2.5 items-start">
          <Shield className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <span>An Administrator has been notified to review your role permissions and activate your account.</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/login"
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-2.5 px-6 rounded-xl shadow-lg shadow-purple-900/30 transition flex items-center justify-center gap-2 text-sm"
        >
          <LogIn className="w-4 h-4" />
          Check / Sign In
        </Link>
        <Link
          href="/"
          className="border border-[#252c4e] hover:bg-[#1a1f3a] text-slate-300 font-semibold py-2.5 px-6 rounded-xl transition flex items-center justify-center gap-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Return Home
        </Link>
      </div>
    </div>
  );
}

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#090b14] relative overflow-hidden">
      <div className="absolute top-1/4 -right-32 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl pointer-events-none" />

      <Suspense fallback={<div className="text-slate-400 text-sm">Loading application status...</div>}>
        <PendingApprovalContent />
      </Suspense>
    </div>
  );
}
