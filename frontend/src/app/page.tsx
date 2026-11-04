"use client";

import { useEffect, useState } from "react";

interface HealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  uptime?: number;
}

export default function Home() {
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
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to connect to backend");
      }
      setHealth(null);
      setLastChecked(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkBackendHealth();
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 sm:p-12 lg:p-16">
      {/* Header */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <span className="text-xs uppercase tracking-widest font-bold text-indigo-600 dark:text-indigo-400">
            Alpha Coding
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            ALPHA CLASSROOM
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            Phase 1 Active
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl w-full mx-auto my-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Hero Card */}
        <div className="lg:col-span-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-8 shadow-sm">
          <div className="inline-block px-3 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 mb-4">
            System Initialization
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
            Educational Platform Foundation Ready
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
            ALPHA CLASSROOM is successfully initialized in Phase 1. The frontend client (Next.js App Router) and backend service (NestJS REST API) are cleanly decoupled and operational in local development mode.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Frontend Client</div>
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-1">Port 3000</div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Next.js + Tailwind</div>
            </div>
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Backend API</div>
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-1">Port 4000</div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">NestJS + TypeScript</div>
            </div>
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Database</div>
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-1">Port 5432</div>
              <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">PostgreSQL 18 + Prisma</div>
            </div>
          </div>
        </div>

        {/* Backend Health Check Widget */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Backend Health</h3>
              <button
                onClick={checkBackendHealth}
                disabled={loading}
                className="text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition font-medium disabled:opacity-50"
              >
                {loading ? "Checking..." : "Refresh"}
              </button>
            </div>

            {loading && !health && !error && (
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-sm text-zinc-500 flex items-center gap-2">
                <span className="inline-block animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full"></span>
                Connecting to backend API...
              </div>
            )}

            {health && (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                    API Connected (200 OK)
                  </div>
                  <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 font-mono">
                    Endpoint: /api/v1/health
                  </div>
                </div>

                <div className="text-xs space-y-1 font-mono text-zinc-600 dark:text-zinc-400 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/40">
                  <div>Status: <span className="font-semibold text-zinc-900 dark:text-zinc-200">{health.status}</span></div>
                  <div>Service: <span className="font-semibold text-zinc-900 dark:text-zinc-200">{health.service}</span></div>
                  <div>Version: <span className="font-semibold text-zinc-900 dark:text-zinc-200">{health.version}</span></div>
                  {health.uptime !== undefined && (
                    <div>Uptime: <span className="font-semibold text-zinc-900 dark:text-zinc-200">{health.uptime.toFixed(1)}s</span></div>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                  Backend Unreachable
                </div>
                <div className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                  {error}
                </div>
                <div className="text-xs text-zinc-500 mt-2">
                  Ensure the NestJS backend is running via <code>npm run start:dev</code> on port 4000.
                </div>
              </div>
            )}
          </div>

          <div className="text-xs text-zinc-400 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            Last checked: {lastChecked || "Just now"}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto border-t border-zinc-200 dark:border-zinc-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
        <div>
          &copy; 2026 ALPHA CLASSROOM &bull; Alpha Coding. Local Development Only.
        </div>
        <div className="flex items-center gap-4">
          <span>Phase 1: Project Scaffolding</span>
          <span>&bull;</span>
          <span>Next Phase: Database & Prisma</span>
        </div>
      </footer>
    </div>
  );
}
