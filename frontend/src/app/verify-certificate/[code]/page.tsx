"use client";

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { VerifyCertificateResponse } from '@/types/certificate';
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  User,
  BookOpen,
  Download,
  AlertTriangle,
  Copy,
  Check,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';

interface PageProps {
  params: Promise<{
    code: string;
  }>;
}

export default function VerifyCertificatePage({ params }: PageProps) {
  const unwrappedParams = use(params);
  const code = unwrappedParams.code;

  const [data, setData] = useState<VerifyCertificateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function verify() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<VerifyCertificateResponse>(
          `/certificates/verify/${encodeURIComponent(code)}`,
        );
        setData(res);
      } catch (err: unknown) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to verify certificate. Record not found.');
        }
      } finally {
        setLoading(false);
      }
    }

    if (code) {
      verify();
    }
  }, [code]);

  const handleCopyCode = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getDownloadUrl = () => {
    const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
    return `${apiHost}/certificates/download/${encodeURIComponent(code)}`;
  };

  return (
    <div className="min-h-screen bg-[#090b14] text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-emerald-900/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="border-b border-[#1f2544] bg-[#0c0e1b]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 p-0.5 shadow-lg shadow-purple-600/30 flex items-center justify-center">
              <div className="w-full h-full bg-[#0c0e1b] rounded-[10px] flex items-center justify-center">
                <Award className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-purple-400 block -mb-0.5">
                Alpha Coding
              </span>
              <span className="text-base font-extrabold text-white tracking-tight">
                ALPHA CLASSROOM
              </span>
            </div>
          </Link>

          <Link
            href="/login"
            className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-[#252c4e] hover:bg-[#1a203a] transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>Learning Portal</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full flex flex-col justify-center">
        {loading ? (
          <div className="bg-[#12162b] border border-[#232948] rounded-2xl p-12 text-center shadow-2xl">
            <div className="w-12 h-12 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-bold text-white mb-1">Verifying Credential...</h2>
            <p className="text-xs text-slate-400 font-mono">Querying central credential registry for {code}</p>
          </div>
        ) : error || !data ? (
          <div className="bg-[#12162b] border border-[#232948] rounded-2xl p-8 sm:p-12 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-5 shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Unverified Credential</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
              The certificate verification code <code className="text-purple-300 font-mono">{code}</code> could
              not be found in our records or may have been revoked.
            </p>
            <div className="flex justify-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-[#1b223d] hover:bg-[#262f55] text-slate-200 text-xs font-semibold py-2.5 px-5 rounded-xl border border-[#2e3966] transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Return to Home
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-[#12162b] border border-[#232948] rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
            {/* Top Verified Ribbon */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-[#1f2544]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-950/40">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>VERIFIED & AUTHENTIC CREDENTIAL</span>
                  </div>
                  <h1 className="text-lg font-bold text-white tracking-tight">
                    Official Certificate of Completion
                  </h1>
                </div>
              </div>

              <a
                href={getDownloadUrl()}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </a>
            </div>

            {/* Recipient Spotlight */}
            <div className="bg-[#0b0e1b] rounded-2xl p-6 border border-[#1f2544] mb-6 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-900/60 to-indigo-900/60 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold text-xl">
                  {data.studentName.charAt(0)}
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider block">
                    Conferred Recipient
                  </span>
                  <h2 className="text-2xl font-extrabold text-white mt-0.5 tracking-tight">
                    {data.studentName}
                  </h2>
                </div>
              </div>

              <div className="text-center sm:text-right">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Final Mastery Standing
                </span>
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  {data.gradePercentage}%
                </span>
              </div>
            </div>

            {/* Credential Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="p-4 rounded-xl bg-[#0c0e1b] border border-[#1f2544] flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Course Specialization
                  </span>
                  <h3 className="text-sm font-bold text-white mt-0.5">
                    {data.courseTitle}
                  </h3>
                  <span className="inline-block mt-1 font-mono text-[11px] px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40">
                    {data.courseCode}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#0c0e1b] border border-[#1f2544] flex items-start gap-3">
                <User className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Lead Academic Instructor
                  </span>
                  <h3 className="text-sm font-bold text-white mt-0.5">
                    {data.instructorName}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Alpha Coding Academic Board
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#0c0e1b] border border-[#1f2544] flex items-start gap-3">
                <Calendar className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Official Issue Date
                  </span>
                  <h3 className="text-sm font-bold text-slate-200 mt-0.5">
                    {new Date(data.issuedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h3>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#0c0e1b] border border-[#1f2544] flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Unique Verification Code
                  </span>
                  <code className="text-xs font-mono font-bold text-purple-300 mt-1 block select-all">
                    {data.certificateCode}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-1.5 rounded-lg border border-[#252c4e] hover:bg-[#1a203a] text-slate-300 hover:text-white transition cursor-pointer self-center"
                  title="Copy verification code"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Official Registry Note */}
            <div className="pt-5 border-t border-[#1f2544] flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>
                  Issued by <strong>ALPHA CLASSROOM Central Accreditation Registry</strong>.
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                Tamper-Proof &bull; Cryptographically Verified
              </span>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1f2544] bg-[#0c0e1b] py-6 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} ALPHA CLASSROOM &bull; Alpha Coding Academy. All rights reserved.
      </footer>
    </div>
  );
}
