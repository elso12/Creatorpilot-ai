"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Settings,
  Database,
  Video,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Key,
  ShieldCheck,
  Server,
  Cpu,
  Info,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

import { DiagnosticsResponse } from "@/types/dashboard";
import { getDiagnostics } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDiagnostics = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getDiagnostics();
      setDiagnostics(data);
      toast.success("Diagnostics refreshed successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to run diagnostics";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDiagnostics();
  }, [fetchDiagnostics]);

  const isDbHealthy = diagnostics?.database_status?.status === "healthy";
  const hasYouTube = diagnostics?.youtube_configured ?? false;
  const hasGemini = diagnostics?.gemini_configured ?? false;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-3">
            <Settings className="h-3.5 w-3.5" />
            <span>Infrastructure & Provider Health</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            System Settings & Diagnostics
          </h1>
          <p className="mt-1 text-sm text-zinc-400 max-w-2xl">
            Inspect real-time service health, database connection latency, and external API provider configurations.
          </p>
        </div>

        {/* Refresh Diagnostics Action */}
        <div>
          <button
            type="button"
            onClick={fetchDiagnostics}
            disabled={isLoading}
            className="h-10 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-white/[0.1] text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            <span>Test Connection & Refresh</span>
          </button>
        </div>
      </div>

      {/* 3 Core Provider Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. PostgreSQL Database */}
        <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="h-11 w-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Database className="h-5 w-5" />
              </div>
              <span
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5",
                  isDbHealthy
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                    : "bg-rose-500/15 text-rose-300 border-rose-500/30"
                )}
              >
                {isDbHealthy ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>Healthy</span>
                  </>
                ) : (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                    <span>Error</span>
                  </>
                )}
              </span>
            </div>

            <h3 className="text-base font-bold text-white">PostgreSQL Database</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Primary relational data store for videos, channels, metric snapshots, and Kanban ideas.
            </p>

            <div className="mt-4 space-y-2 p-3 rounded-xl bg-zinc-950/60 border border-white/[0.04] text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Engine / Driver:</span>
                <span className="text-zinc-300 font-mono">
                  {diagnostics?.database_status?.dialect || "PostgreSQL (psycopg3)"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Latency:</span>
                <span className="text-emerald-400 font-mono font-bold">
                  {diagnostics?.database_status?.latency_ms !== undefined
                    ? `${diagnostics.database_status.latency_ms} ms`
                    : "Measuring..."}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Connection Pool:</span>
                <span className="text-zinc-300">Active (SQLAlchemy 2.0)</span>
              </div>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-zinc-500 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Connection verified via live query</span>
          </div>
        </div>

        {/* 2. YouTube Data API v3 */}
        <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="h-11 w-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                <Video className="h-5 w-5" />
              </div>
              <span
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5",
                  hasYouTube
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                    : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                )}
              >
                {hasYouTube ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>Live API</span>
                  </>
                ) : (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    <span>Simulation Mode</span>
                  </>
                )}
              </span>
            </div>

            <h3 className="text-base font-bold text-white">YouTube Data API v3</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Powers video research, channel statistics, and recent upload sync.
            </p>

            <div className="mt-4 space-y-2 p-3 rounded-xl bg-zinc-950/60 border border-white/[0.04] text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Mode:</span>
                <span className="text-zinc-200 font-medium">
                  {diagnostics?.youtube_mode || "Checking..."}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">API Key:</span>
                <span className="font-mono text-zinc-300">
                  {diagnostics?.youtube_key_snippet || "None (Using Mock Data)"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Free Quota:</span>
                <span className="text-zinc-400">10,000 units/day</span>
              </div>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-zinc-500 space-y-1">
            <div className="flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-zinc-400" />
              <span>Configured in <code className="text-zinc-300">backend/.env</code></span>
            </div>
            <div className="text-[10px] text-zinc-600 font-mono">
              YOUTUBE_API_KEY=AIzaSy...
            </div>
          </div>
        </div>

        {/* 3. Google Gemini AI Studio */}
        <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="h-11 w-11 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                <Sparkles className="h-5 w-5" />
              </div>
              <span
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5",
                  hasGemini
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                    : "bg-purple-500/15 text-purple-300 border-purple-500/30"
                )}
              >
                {hasGemini ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>Live Gemini</span>
                  </>
                ) : (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                    <span>Studio Simulation</span>
                  </>
                )}
              </span>
            </div>

            <h3 className="text-base font-bold text-white">Gemini AI Provider</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Synthesizes psychological titles, retention hooks, narrative outlines, and market reports.
            </p>

            <div className="mt-4 space-y-2 p-3 rounded-xl bg-zinc-950/60 border border-white/[0.04] text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Engine / Model:</span>
                <span className="text-purple-300 font-semibold">Gemini 2.0 Flash</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">API Key:</span>
                <span className="font-mono text-zinc-300">
                  {diagnostics?.gemini_key_snippet || "None (Using Studio Engine)"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Fallback Strategy:</span>
                <span className="text-zinc-400">High-Fidelity Mock Generator</span>
              </div>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-zinc-500 space-y-1">
            <div className="flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-zinc-400" />
              <span>Configured in <code className="text-zinc-300">backend/.env</code></span>
            </div>
            <div className="text-[10px] text-zinc-600 font-mono">
              GEMINI_API_KEY=AIzaSy...
            </div>
          </div>
        </div>
      </div>

      {/* Architecture & Quota Guide Callout */}
      <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <Info className="h-4 w-4 text-indigo-400" />
          <span>API Configuration & Quota Optimization Guide</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-zinc-400 leading-relaxed">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-zinc-200">Zero-Cost Offline Simulation Mode</h4>
            <p>
              CreatorPilot AI is architected with graceful fallback mocks. Even without any API keys configured,
              all features (YouTube search, channel scraping, Opportunity Scoring calculations, and AI content packs)
              operate in high-fidelity simulation mode. This allows full portfolio demonstration without incurring API quota costs.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-zinc-200">Enabling Live Google Services</h4>
            <p>
              To connect real live YouTube Data API and Google Gemini GenAI:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-zinc-300">
              <li>Open <code className="text-indigo-300">backend/.env</code> in your editor.</li>
              <li>Add your Google Cloud YouTube Data API v3 key to <code className="text-indigo-300">YOUTUBE_API_KEY</code>.</li>
              <li>Add your Google AI Studio key to <code className="text-indigo-300">GEMINI_API_KEY</code>.</li>
              <li>Restart the FastAPI backend server to take effect.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
