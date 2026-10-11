"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Compass,
  Search,
  Users2,
  Sparkles,
  CalendarDays,
  Settings as SettingsIcon,
  TrendingUp,
  Flame,
  ArrowRight,
  ExternalLink,
  Zap,
  CheckCircle2,
  Clock,
  Layers,
  Award,
  Video,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { DashboardOverviewResponse } from "@/types/dashboard";
import { getDashboardOverview } from "@/lib/api";
import { cn, formatCompactNumber, formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getDashboardOverview();
        setData(res);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load dashboard overview";
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const readyOrPublished =
    (data?.ideas_by_status?.Ready || 0) + (data?.ideas_by_status?.Published || 0);

  const isLiveYouTube = data?.system_status?.youtube_api === "live";
  const isLiveGemini = data?.system_status?.gemini_api === "live";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-3">
            <Compass className="h-3.5 w-3.5" />
            <span>Executive Creator Cockpit</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            CreatorPilot Intelligence Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-400 max-w-2xl">
            Real-time YouTube market intelligence, breakout competitor detection, and production-ready ideation pipeline.
          </p>
        </div>

        {/* System Status Pill Linking to Settings */}
        <Link
          href="/settings"
          className="glass-panel p-2.5 px-4 rounded-2xl border border-white/[0.08] hover:border-indigo-500/40 transition-all flex items-center gap-3 self-start md:self-auto group"
        >
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                isLiveYouTube && isLiveGemini
                  ? "bg-emerald-400 animate-pulse"
                  : "bg-amber-400"
              )}
            />
            <span className="text-xs font-semibold text-zinc-200">
              {isLiveYouTube && isLiveGemini
                ? "Live API Providers Active"
                : "Offline Simulation Mode"}
            </span>
          </div>
          <div className="text-[10px] text-zinc-500 group-hover:text-indigo-400 flex items-center gap-1 transition-colors">
            <span>Diagnostics</span>
            <ArrowRight className="h-3 w-3" />
          </div>
        </Link>
      </div>

      {/* Metric Banner Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Saved Research Videos */}
        <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] relative overflow-hidden group hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs uppercase font-bold tracking-wider">Saved Videos</span>
            <Search className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-black text-white">
            {isLoading ? "..." : data?.total_saved_videos || 0}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1 flex items-center justify-between">
            <span>Research repository</span>
            <Link href="/research" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Explore &rarr;
            </Link>
          </div>
        </div>

        {/* 2. Tracked Competitors */}
        <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] relative overflow-hidden group hover:border-purple-500/30 transition-all">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs uppercase font-bold tracking-wider">Tracked Creators</span>
            <Users2 className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-3xl font-black text-purple-300">
            {isLoading ? "..." : data?.total_tracked_competitors || 0}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1 flex items-center justify-between">
            <span>Watchlist baselines</span>
            <Link href="/competitors" className="text-purple-400 hover:text-purple-300 font-medium">
              Watchlist &rarr;
            </Link>
          </div>
        </div>

        {/* 3. Active Ideas in Pipeline */}
        <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] relative overflow-hidden group hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs uppercase font-bold tracking-wider">Active Ideas</span>
            <CalendarDays className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-300">
            {isLoading ? "..." : data?.total_ideas_in_pipeline || 0}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1 flex items-center justify-between">
            <span>Kanban stages</span>
            <Link href="/planner" className="text-amber-400 hover:text-amber-300 font-medium">
              Board &rarr;
            </Link>
          </div>
        </div>

        {/* 4. Production Readiness */}
        <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs uppercase font-bold tracking-wider">Ready / Published</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400">
            {isLoading ? "..." : readyOrPublished}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1 flex items-center justify-between">
            <span>Production stage</span>
            <Link href="/planner" className="text-emerald-400 hover:text-emerald-300 font-medium">
              Review &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/research"
          className="glass-panel rounded-2xl p-4 border border-white/[0.06] hover:border-indigo-500/40 hover:bg-white/[0.02] transition-all flex items-center gap-3 group"
        >
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Search className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Research Topic</div>
            <div className="text-[10px] text-zinc-500">Search YouTube & save</div>
          </div>
        </Link>

        <Link
          href="/competitors"
          className="glass-panel rounded-2xl p-4 border border-white/[0.06] hover:border-purple-500/40 hover:bg-white/[0.02] transition-all flex items-center gap-3 group"
        >
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Users2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Track Competitors</div>
            <div className="text-[10px] text-zinc-500">Uncover 3x outliers</div>
          </div>
        </Link>

        <Link
          href="/ai-studio"
          className="glass-panel rounded-2xl p-4 border border-white/[0.06] hover:border-amber-500/40 hover:bg-white/[0.02] transition-all flex items-center gap-3 group"
        >
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Generate AI Pack</div>
            <div className="text-[10px] text-zinc-500">Titles, hooks & briefs</div>
          </div>
        </Link>

        <Link
          href="/planner"
          className="glass-panel rounded-2xl p-4 border border-white/[0.06] hover:border-emerald-500/40 hover:bg-white/[0.02] transition-all flex items-center gap-3 group"
        >
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Open Kanban</div>
            <div className="text-[10px] text-zinc-500">Manage pipeline</div>
          </div>
        </Link>
      </div>

      {/* Main Two-Column Section: Top Outliers vs Recent Research */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Top Outlier Alerts (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
                High-Value Outlier Alerts
              </h2>
            </div>
            <Link
              href="/competitors"
              className="text-xs text-purple-400 hover:text-purple-300 font-medium"
            >
              View all &rarr;
            </Link>
          </div>

          {isLoading ? (
            <div className="glass-panel rounded-2xl p-12 text-center text-xs text-zinc-500">
              <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-indigo-400" />
              Calculating opportunity scores...
            </div>
          ) : !data?.top_opportunities || data.top_opportunities.length === 0 ? (
            /* Zero-state guide */
            <div className="glass-panel rounded-2xl p-8 border border-white/[0.08] text-center">
              <div className="h-12 w-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-3">
                <Users2 className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-zinc-200">No Competitor Videos Tracked Yet</h3>
              <p className="text-xs text-zinc-400 mt-1 mb-4 max-w-md mx-auto">
                Track top creator channels (e.g. <span className="text-purple-300 font-mono">@Fireship</span> or <span className="text-purple-300 font-mono">@TheoE10s</span>) to detect high-velocity breakout videos that outperform channel medians by 2x–5x.
              </p>
              <Link
                href="/competitors"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-all"
              >
                <span>Track First Competitor</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {data.top_opportunities.map((item) => (
                <div
                  key={item.id}
                  className="glass-panel rounded-2xl p-4 border border-amber-500/20 hover:border-amber-500/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-500/[0.03] to-transparent group"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="relative aspect-video w-28 rounded-xl overflow-hidden bg-zinc-900 flex-shrink-0">
                      {item.thumbnail_url ? (
                        <Image
                          src={item.thumbnail_url}
                          alt={item.title}
                          fill
                          sizes="112px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-zinc-800">
                          <Video className="h-5 w-5 text-zinc-600" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          {item.performance_ratio}x Channel Avg
                        </span>
                        <span className="text-[10px] text-zinc-400 truncate">
                          {item.channel_title}
                        </span>
                      </div>
                      <a
                        href={item.youtube_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-white group-hover:text-amber-200 transition-colors line-clamp-2"
                      >
                        {item.title}
                      </a>
                      <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1">
                        <span>{formatCompactNumber(item.view_count)} views</span>
                        <span>•</span>
                        <span className="text-purple-300 font-medium">
                          {formatCompactNumber(item.views_per_day)}/day
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Link
                      href="/ai-studio"
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Generate Idea</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Recent Research Repository (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-indigo-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
                Recent Research Feed
              </h2>
            </div>
            <Link
              href="/research"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Search more &rarr;
            </Link>
          </div>

          {isLoading ? (
            <div className="glass-panel rounded-2xl p-12 text-center text-xs text-zinc-500">
              Loading saved videos...
            </div>
          ) : !data?.recent_saved_videos || data.recent_saved_videos.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8 border border-white/[0.08] text-center">
              <Search className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
              <div className="text-xs font-semibold text-zinc-300">No saved research videos</div>
              <p className="text-[11px] text-zinc-500 mt-1 mb-3">
                Search topics in the Research engine and save high-retention videos for AI grounding.
              </p>
              <Link
                href="/research"
                className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-xs font-medium border border-indigo-500/40 inline-flex items-center gap-1"
              >
                <span>Search Topics</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {data.recent_saved_videos.map((vid) => (
                <div
                  key={vid.id}
                  className="glass-panel rounded-xl p-3 border border-white/[0.06] hover:border-white/[0.12] transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-zinc-100 group-hover:text-indigo-300 transition-colors truncate">
                      {vid.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                      <span className="truncate max-w-[120px]">{vid.channel_title}</span>
                      <span>•</span>
                      <span>{formatCompactNumber(vid.view_count)} views</span>
                      <span>•</span>
                      <span>{vid.duration_formatted}</span>
                    </div>
                  </div>

                  <a
                    href={vid.youtube_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors flex-shrink-0"
                    title="Watch on YouTube"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
