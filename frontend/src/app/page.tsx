"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { LogIn, UserPlus, ArrowRight, ShieldCheck, Database, Server, Laptop } from "lucide-react";

interface HealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  uptime?: number;
  database?: {
    status: string;
    provider: string;
  };
}

export default function Home() {
  const { user } = useAuth();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string>("");

  const checkBackendHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
      const res = await fetch(`${apiUrl}/health`, {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      setHealth(data);
      setLastChecked("Recently");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to connect to backend");
      }
      setHealth(null);
      setLastChecked("Recently");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkBackendHealth();
  }, []);

  const getDashboardLink = () => {
    if (!user) return "/login";
    if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") return "/admin";
    if (user.role === "INSTRUCTOR") return "/instructor";
    return "/student";
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 sm:p-12 lg:p-16 bg-[#090b14] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-purple-900/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-indigo-900/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between border-b border-[#1c223c] pb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-extrabold text-white text-lg shadow-lg shadow-purple-900/40">
            α
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-widest font-bold text-purple-400 block -mb-1">
              Alpha Coding
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              ALPHA CLASSROOM
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <Link
              href={getDashboardLink()}
              className="bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 px-4 rounded-xl text-xs transition flex items-center gap-1.5 shadow-md shadow-purple-900/30"
            >
              Go to Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="bg-[#12162b] hover:bg-[#1a203a] border border-[#21294c] text-slate-200 font-semibold py-2 px-4 rounded-xl text-xs transition flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 px-4 rounded-xl text-xs transition hidden sm:flex items-center gap-1.5 shadow-md shadow-purple-900/30"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Register
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl w-full mx-auto my-12 grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        {/* Hero Card */}
        <div className="lg:col-span-2 rounded-2xl border border-[#21294c] bg-[#12162b] p-8 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-purple-950/80 text-purple-300 border border-purple-800/60 mb-4">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              Phase 4 Active: User Management & RBAC
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-4">
              Centralized Educational Platform for Alpha Coding
            </h2>
            <p className="text-slate-300 leading-relaxed mb-6">
              ALPHA CLASSROOM supports multi-tier role access for Super Admins, Administrators, Instructors, and Students with an integrated user approval lifecycle.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#1a2038]">
              <div className="p-4 rounded-xl bg-[#0b0e1b] border border-[#1d233f]">
                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                  <Laptop className="w-3.5 h-3.5 text-purple-400" /> Frontend Client
                </div>
                <div className="text-sm font-bold text-white mt-1">Port 3000</div>
                <div className="text-xs text-emerald-400 mt-1">Next.js 16 + Tailwind</div>
              </div>
              <div className="p-4 rounded-xl bg-[#0b0e1b] border border-[#1d233f]">
                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                  <Server className="w-3.5 h-3.5 text-indigo-400" /> Backend API
                </div>
                <div className="text-sm font-bold text-white mt-1">Port 4000</div>
                <div className="text-xs text-emerald-400 mt-1">NestJS 12 + JWT RBAC</div>
              </div>
              <div className="p-4 rounded-xl bg-[#0b0e1b] border border-[#1d233f]">
                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                  <Database className="w-3.5 h-3.5 text-amber-400" /> Database
                </div>
                <div className="text-sm font-bold text-white mt-1">Port 5432</div>
                <div className="text-xs text-emerald-400 mt-1">PostgreSQL 18 + Prisma</div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#1a2038] flex flex-wrap gap-3">
            <Link
              href="/login"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg shadow-purple-900/30 transition text-xs flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" /> Sign In to Portal
            </Link>
            <Link
              href="/register"
              className="bg-[#0b0e1b] hover:bg-[#141930] border border-[#232a4e] text-slate-200 font-semibold py-2.5 px-5 rounded-xl transition text-xs flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" /> Apply for Account
            </Link>
          </div>
        </div>

        {/* Backend & DB Health Check Widget */}
        <div className="rounded-2xl border border-[#21294c] bg-[#12162b] p-8 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-white">System Diagnostics</h3>
              <button
                onClick={checkBackendHealth}
                disabled={loading}
                className="text-xs px-2.5 py-1 rounded-lg border border-[#232948] hover:bg-[#191f3a] text-slate-300 transition font-medium disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Checking..." : "Refresh"}
              </button>
            </div>

            {loading && !health && !error && (
              <div className="p-4 rounded-xl bg-[#0b0e1b] border border-[#1a2038] text-xs text-slate-400 flex items-center gap-2">
                <span className="inline-block animate-spin h-3.5 w-3.5 border-2 border-purple-500 border-t-transparent rounded-full" />
                Connecting to backend API...
              </div>
            )}

            {health && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    API Service Online (200 OK)
                  </div>
                  <div className="text-[11px] text-emerald-400/80 mt-1 font-mono">
                    Endpoint: /api/v1/health
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-800/50">
                  <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
                    <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
                    PostgreSQL: {health.database?.status ?? "connected"}
                  </div>
                  <div className="text-[11px] text-purple-400/80 mt-1 font-mono">
                    Database: alpha_classroom_db
                  </div>
                </div>

                <div className="text-xs space-y-1 font-mono text-slate-400 p-3 rounded-xl bg-[#0b0e1b] border border-[#1a2038]">
                  <div>Status: <span className="font-semibold text-slate-200">{health.status}</span></div>
                  <div>Service: <span className="font-semibold text-slate-200">{health.service}</span></div>
                  <div>Version: <span className="font-semibold text-slate-200">{health.version}</span></div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/50 text-xs text-amber-200">
                <div className="font-bold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400" /> Backend Disconnected
                </div>
                <div className="mt-1 text-slate-400">{error}</div>
              </div>
            )}
          </div>

          <div className="text-xs text-slate-500 pt-4 border-t border-[#1a2038]">
            Checked: {lastChecked || "Just now"}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto border-t border-[#1c223c] pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4 relative z-10">
        <div>
          &copy; 2026 ALPHA CLASSROOM &bull; Alpha Coding. Local Development Only.
        </div>
        <div className="flex items-center gap-4">
          <span>Phase 4: User Management & Auth</span>
          <span>&bull;</span>
          <span>Next Phase: Course Management</span>
        </div>
      </footer>
    </div>
  );
}
