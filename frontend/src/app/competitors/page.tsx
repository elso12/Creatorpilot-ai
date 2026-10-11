"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  Users2,
  Plus,
  Camera,
  Trash2,
  TrendingUp,
  ExternalLink,
  Flame,
  Award,
  Calendar,
  Sparkles,
  Info,
  RefreshCw,
  Zap,
  Lightbulb,
  X,
  Play,
  ArrowUpRight,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

import {
  CompetitorChannel,
  CompetitorVideo,
} from "@/types/competitor";
import {
  getCompetitors,
  addCompetitor,
  getCompetitorVideos,
  recordCompetitorSnapshot,
  deleteCompetitor,
} from "@/lib/api";
import { cn, formatCompactNumber, formatDate } from "@/lib/utils";

const PRESET_HANDLES = [
  "@Fireship",
  "@TheoE10s",
  "@WebDevSimplified",
  "@t3dotgg",
];

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<CompetitorChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<CompetitorChannel | null>(null);
  const [videos, setVideos] = useState<CompetitorVideo[]>([]);
  const [newHandle, setNewHandle] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [snapshottingId, setSnapshottingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"score" | "ratio" | "views" | "date">("score");
  const [filterOutliersOnly, setFilterOutliersOnly] = useState(false);

  // Score breakdown drawer/modal state
  const [inspectingVideo, setInspectingVideo] = useState<CompetitorVideo | null>(null);

  // Load all competitor channels
  const loadCompetitors = useCallback(async (selectFirst = false) => {
    setIsLoadingChannels(true);
    try {
      const data = await getCompetitors();
      setCompetitors(data);
      if (data.length > 0) {
        if (selectFirst || !selectedChannel) {
          setSelectedChannel(data[0]);
        } else {
          // Keep selection if exists
          const stillExists = data.find((c) => c.id === selectedChannel.id);
          setSelectedChannel(stillExists || data[0]);
        }
      } else {
        setSelectedChannel(null);
        setVideos([]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load competitors";
      toast.error(msg);
    } finally {
      setIsLoadingChannels(false);
    }
  }, [selectedChannel]);

  // Load videos for selected competitor
  const loadChannelVideos = useCallback(async (channelId: number, sort: string) => {
    setIsLoadingVideos(true);
    try {
      const vids = await getCompetitorVideos(channelId, sort);
      setVideos(vids);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load channel videos";
      toast.error(msg);
    } finally {
      setIsLoadingVideos(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadCompetitors(true);
  }, []);

  // When selectedChannel or sortBy changes
  useEffect(() => {
    if (selectedChannel) {
      loadChannelVideos(selectedChannel.id, sortBy);
    }
  }, [selectedChannel, sortBy, loadChannelVideos]);

  // Add Competitor
  const handleAddCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHandle.trim()) {
      toast.warning("Please enter a creator handle or channel ID");
      return;
    }

    setIsAdding(true);
    try {
      const created = await addCompetitor(newHandle.trim());
      toast.success(`Tracked "${created.title}"!`, {
        description: `Imported ${created.saved_videos_count} recent uploads and computed channel baseline.`,
      });
      setNewHandle("");
      await loadCompetitors();
      setSelectedChannel(created);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add competitor";
      toast.error(msg);
    } finally {
      setIsAdding(false);
    }
  };

  // Record Snapshot
  const handleRecordSnapshot = async (channelId: number, channelTitle: string) => {
    setSnapshottingId(channelId);
    try {
      const res = await recordCompetitorSnapshot(channelId);
      toast.success(`Snapshot recorded for ${channelTitle}!`, {
        description: `Tracked ${res.videos_updated} videos. Total views delta: +${formatCompactNumber(res.total_views_delta)} views.`,
      });
      if (selectedChannel && selectedChannel.id === channelId) {
        loadChannelVideos(channelId, sortBy);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Snapshot failed";
      toast.error(msg);
    } finally {
      setSnapshottingId(null);
    }
  };

  // Delete Competitor
  const handleDeleteCompetitor = async (channelId: number, channelTitle: string) => {
    setDeletingId(channelId);
    try {
      await deleteCompetitor(channelId);
      toast.info(`Removed ${channelTitle} from watchlist`);
      await loadCompetitors(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Delete failed";
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  // Create Idea shortcut
  const handleCreateIdea = (video: CompetitorVideo) => {
    toast.success(`Generated content idea draft!`, {
      description: `Based on viral angle: "${video.title.slice(0, 50)}..." (${video.performance_ratio}x channel average).`,
    });
  };

  // Filtered videos
  const displayedVideos = filterOutliersOnly
    ? videos.filter((v) => v.opportunity_score >= 70 || v.performance_ratio >= 2.0)
    : videos;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium mb-3">
            <Users2 className="h-3.5 w-3.5" />
            <span>Competitive Intelligence & Opportunity Scoring</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Competitor Research & Outlier Detection
          </h1>
          <p className="mt-1 text-sm text-zinc-400 max-w-2xl">
            Track top creator channels in your niche, calculate performance baselines,
            and instantly uncover viral breakout videos (2x–5x channel median).
          </p>
        </div>

        {/* Add Channel Bar */}
        <div className="w-full md:w-auto">
          <form onSubmit={handleAddCompetitor} className="flex items-center gap-2">
            <div className="relative flex-1 md:w-64">
              <input
                type="text"
                value={newHandle}
                onChange={(e) => setNewHandle(e.target.value)}
                placeholder="Channel @handle or ID..."
                className="w-full h-10 px-3.5 rounded-xl bg-zinc-900 border border-white/[0.1] text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>
            <button
              type="submit"
              disabled={isAdding}
              className="h-10 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all disabled:opacity-50"
            >
              {isAdding ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              <span>Track Channel</span>
            </button>
          </form>

          {/* Preset Handles */}
          <div className="flex items-center gap-1.5 mt-2 justify-end">
            <span className="text-[10px] text-zinc-500">Quick:</span>
            {PRESET_HANDLES.map((handle) => (
              <button
                key={handle}
                type="button"
                onClick={() => {
                  setNewHandle(handle);
                }}
                className="text-[10px] text-zinc-400 hover:text-purple-300 px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/[0.04] transition-colors"
              >
                {handle}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Channels Watchlist on Left, Outliers Feed on Right */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Channels Watchlist (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
              <span>Tracked Watchlist</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                {competitors.length}
              </span>
            </h2>
            <button
              onClick={() => loadCompetitors()}
              disabled={isLoadingChannels}
              className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
            >
              <RefreshCw className={cn("h-3 w-3", isLoadingChannels && "animate-spin")} />
              <span>Refresh</span>
            </button>
          </div>

          {isLoadingChannels && competitors.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8 text-center text-xs text-zinc-500">
              <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-purple-400" />
              Loading channels...
            </div>
          ) : competitors.length === 0 ? (
            <div className="glass-panel rounded-2xl p-6 text-center border border-white/[0.08]">
              <Users2 className="h-8 w-8 text-zinc-500 mx-auto mb-2" />
              <h3 className="text-xs font-semibold text-zinc-300">No channels tracked yet</h3>
              <p className="text-[11px] text-zinc-500 mt-1 mb-3">
                Add a creator like <span className="text-purple-400 font-mono">@Fireship</span> or <span className="text-purple-400 font-mono">@TheoE10s</span> to start uncovering breakout ideas.
              </p>
              <button
                onClick={() => {
                  setNewHandle("@Fireship");
                }}
                className="px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 text-xs font-medium border border-purple-500/40"
              >
                Try @Fireship
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {competitors.map((chan) => {
                const isSelected = selectedChannel?.id === chan.id;
                const isSnapshotting = snapshottingId === chan.id;
                const isDeleting = deletingId === chan.id;

                return (
                  <div
                    key={chan.id}
                    onClick={() => setSelectedChannel(chan)}
                    className={cn(
                      "p-4 rounded-2xl cursor-pointer transition-all border",
                      isSelected
                        ? "bg-purple-950/20 border-purple-500/40 shadow-lg shadow-purple-950/30 ring-1 ring-purple-500/30"
                        : "glass-panel glass-panel-hover border-white/[0.06] hover:border-white/[0.15]"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Avatar & Title */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative h-11 w-11 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0 ring-1 ring-white/10">
                          {chan.thumbnail_url ? (
                            <Image
                              src={chan.thumbnail_url}
                              alt={chan.title}
                              fill
                              sizes="44px"
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-xs font-bold text-zinc-400">
                              {chan.title.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-zinc-100 truncate flex items-center gap-1.5">
                            <span>{chan.title}</span>
                          </h3>
                          <div className="text-xs text-purple-400 font-mono">
                            {chan.custom_url || chan.youtube_channel_id.slice(0, 12)}
                          </div>
                        </div>
                      </div>

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCompetitor(chan.id, chan.title);
                        }}
                        disabled={isDeleting}
                        className="text-zinc-500 hover:text-red-400 p-1 rounded-md transition-colors"
                        title="Remove from watchlist"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Stats pills */}
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/[0.04] text-center">
                      <div className="bg-zinc-950/50 rounded-lg py-1 px-1.5">
                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Subs</div>
                        <div className="text-xs font-bold text-zinc-200">
                          {formatCompactNumber(chan.subscriber_count)}
                        </div>
                      </div>
                      <div className="bg-zinc-950/50 rounded-lg py-1 px-1.5">
                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Median</div>
                        <div className="text-xs font-bold text-emerald-400">
                          {formatCompactNumber(chan.median_views)}
                        </div>
                      </div>
                      <div className="bg-zinc-950/50 rounded-lg py-1 px-1.5">
                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Videos</div>
                        <div className="text-xs font-bold text-zinc-200">
                          {chan.saved_videos_count}
                        </div>
                      </div>
                    </div>

                    {/* Snapshot Action Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRecordSnapshot(chan.id, chan.title);
                      }}
                      disabled={isSnapshotting}
                      className="w-full mt-3 h-8 rounded-xl bg-zinc-900 hover:bg-purple-600 hover:text-white text-zinc-300 border border-white/[0.08] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      {isSnapshotting ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Taking Snapshot...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="h-3.5 w-3.5 text-purple-400" />
                          <span>Record Snapshot Delta</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Outlier Opportunity Feed (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Channel Header & Filter Controls */}
          <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 uppercase font-semibold">Active Competitor:</span>
                <span className="text-base font-extrabold text-white">
                  {selectedChannel ? selectedChannel.title : "No Channel Selected"}
                </span>
                {selectedChannel && (
                  <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                    Baseline: {formatCompactNumber(selectedChannel.median_views)} median views
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Calculated opportunity score ranks videos by Outlier Pull (40%), Velocity (30%), Engagement (20%), and Small Channel Bonus (10%).
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2">
              {/* Outliers Only Toggle */}
              <button
                type="button"
                onClick={() => setFilterOutliersOnly(!filterOutliersOnly)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border",
                  filterOutliersOnly
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40 ring-1 ring-amber-500/30"
                    : "bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border-white/[0.08]"
                )}
              >
                <Flame className={cn("h-3.5 w-3.5", filterOutliersOnly ? "text-amber-400" : "text-zinc-500")} />
                <span>Outliers Only</span>
              </button>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "score" | "ratio" | "views" | "date")}
                className="h-8 px-3 rounded-xl bg-zinc-900 border border-white/[0.1] text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="score">Opportunity Score</option>
                <option value="ratio">Performance Ratio</option>
                <option value="views">Most Views</option>
                <option value="date">Most Recent</option>
              </select>
            </div>
          </div>

          {/* Videos Feed */}
          {isLoadingVideos ? (
            <div className="glass-panel rounded-2xl p-16 text-center text-xs text-zinc-400">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-3 text-purple-400" />
              Computing opportunity scores for uploads...
            </div>
          ) : displayedVideos.length === 0 ? (
            <div className="glass-panel rounded-2xl p-12 text-center text-zinc-500 border border-white/[0.08]">
              <Filter className="h-10 w-10 mx-auto mb-2 text-zinc-600" />
              <h3 className="text-sm font-semibold text-zinc-300">No videos match filter</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Toggle off &quot;Outliers Only&quot; to view all channel uploads.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedVideos.map((video) => {
                const isBreakout = video.opportunity_score >= 80;
                const isAboveAverage = video.opportunity_score >= 60 && !isBreakout;
                const ratio = video.performance_ratio;

                return (
                  <div
                    key={video.id}
                    className={cn(
                      "glass-panel rounded-2xl p-4 border transition-all hover:border-white/[0.15] flex flex-col md:flex-row items-start md:items-center justify-between gap-4",
                      isBreakout
                        ? "bg-gradient-to-r from-amber-500/[0.07] via-purple-500/[0.04] to-transparent border-amber-500/30"
                        : "border-white/[0.06]"
                    )}
                  >
                    {/* Thumbnail & Title Info */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className="relative aspect-video w-32 sm:w-36 rounded-xl overflow-hidden bg-zinc-900 flex-shrink-0 group">
                        {video.thumbnail_url ? (
                          <Image
                            src={video.thumbnail_url}
                            alt={video.title}
                            fill
                            sizes="144px"
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-zinc-800">
                            <Play className="h-6 w-6 text-zinc-600" />
                          </div>
                        )}
                        <div className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.2 text-[10px] font-bold text-white">
                          {video.duration_formatted}
                        </div>
                        <a
                          href={video.youtube_url}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <ExternalLink className="h-5 w-5 text-white" />
                        </a>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(video.published_at)}
                          </span>
                          {/* Performance ratio badge */}
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                              ratio >= 2.5
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                : ratio >= 1.5
                                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                                : "bg-zinc-800 text-zinc-400 border-zinc-700/60"
                            )}
                          >
                            {ratio}x Channel Avg
                          </span>
                        </div>

                        <a
                          href={video.youtube_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-bold text-zinc-100 hover:text-purple-300 transition-colors line-clamp-2"
                        >
                          {video.title}
                        </a>

                        {/* Velocity & stats */}
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-zinc-400">
                          <div>
                            <span className="text-zinc-200 font-semibold">{formatCompactNumber(video.view_count)}</span> views
                          </div>
                          <div className="flex items-center gap-1 text-purple-300">
                            <TrendingUp className="h-3 w-3" />
                            <span>{formatCompactNumber(video.views_per_day)}/day</span>
                          </div>
                          <div>
                            <span className="text-zinc-300">{video.engagement_rate}%</span> engagement
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Opportunity Score Pill & Actions */}
                    <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-white/[0.04]">
                      {/* Score Badge */}
                      <button
                        type="button"
                        onClick={() => setInspectingVideo(video)}
                        className={cn(
                          "flex flex-col items-center justify-center px-4 py-2 rounded-xl border text-center transition-transform hover:scale-105",
                          isBreakout
                            ? "bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-lg shadow-amber-500/10"
                            : isAboveAverage
                            ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-300"
                            : "bg-zinc-900 border-white/[0.08] text-zinc-300"
                        )}
                        title="Click to view transparent score breakdown"
                      >
                        <div className="flex items-center gap-1 text-xs font-black">
                          {isBreakout && <Flame className="h-3.5 w-3.5 text-amber-400" />}
                          <span>{video.opportunity_score}</span>
                          <span className="text-[10px] text-zinc-400 font-normal">/100</span>
                        </div>
                        <div className="text-[10px] font-semibold tracking-wider uppercase mt-0.5">
                          {video.classification}
                        </div>
                      </button>

                      {/* Idea Button */}
                      <button
                        type="button"
                        onClick={() => handleCreateIdea(video)}
                        className="h-10 px-3.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 hover:text-white text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                        title="Create content idea from this outlier"
                      >
                        <Lightbulb className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Use as Idea</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Transparent Score Breakdown Modal / Drawer */}
      {inspectingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel max-w-lg w-full rounded-3xl p-6 border border-white/[0.12] shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              onClick={() => setInspectingVideo(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Opportunity Score Breakdown
                </h3>
                <p className="text-xs text-zinc-400">
                  Transparent mathematical weighting for this video
                </p>
              </div>
            </div>

            {/* Video preview */}
            <div className="p-3 rounded-xl bg-zinc-950/70 border border-white/[0.06] mb-5">
              <div className="text-xs font-semibold text-zinc-200 line-clamp-1">
                {inspectingVideo.title}
              </div>
              <div className="text-[11px] text-purple-400 mt-0.5">
                {inspectingVideo.channel_title} • {formatCompactNumber(inspectingVideo.view_count)} views
              </div>
            </div>

            {/* Composite Score Banner */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-amber-950/20 to-zinc-900 border border-amber-500/30 mb-5">
              <div>
                <div className="text-xs text-amber-300 font-semibold uppercase tracking-wider">
                  Final Composite Score
                </div>
                <div className="text-2xl font-black text-white">
                  {inspectingVideo.opportunity_score} / 100
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {inspectingVideo.classification}
              </span>
            </div>

            {/* Weights List */}
            <div className="space-y-3 text-xs">
              {/* 1. Outlier Pull */}
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/[0.04]">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-zinc-200">Outlier Pull (40% weight)</span>
                  <span className="font-bold text-amber-300">
                    +{inspectingVideo.breakdown.outlier_points} pts
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400">
                  Ratio: <span className="text-zinc-200">{inspectingVideo.performance_ratio}x</span> channel median (subscore: {inspectingVideo.breakdown.outlier_subscore}/100)
                </div>
              </div>

              {/* 2. View Velocity */}
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/[0.04]">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-zinc-200">View Velocity (30% weight)</span>
                  <span className="font-bold text-indigo-300">
                    +{inspectingVideo.breakdown.velocity_points} pts
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400">
                  Rate: <span className="text-zinc-200">{formatCompactNumber(inspectingVideo.views_per_day)} views/day</span> (subscore: {inspectingVideo.breakdown.velocity_subscore}/100)
                </div>
              </div>

              {/* 3. Engagement Rate */}
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/[0.04]">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-zinc-200">Engagement Benchmark (20% weight)</span>
                  <span className="font-bold text-purple-300">
                    +{inspectingVideo.breakdown.engagement_points} pts
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400">
                  Rate: <span className="text-zinc-200">{inspectingVideo.engagement_rate}%</span> vs 4.0% standard (subscore: {inspectingVideo.breakdown.engagement_subscore}/100)
                </div>
              </div>

              {/* 4. Small Channel Bonus */}
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/[0.04]">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-zinc-200">Small Channel Multiplier (10% weight)</span>
                  <span className="font-bold text-emerald-300">
                    +{inspectingVideo.breakdown.small_channel_points} pts
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400">
                  {inspectingVideo.breakdown.small_channel_subscore > 0
                    ? "Awarded: Subs < 50k and performance ratio > 1.5x"
                    : "Not applicable (> 50k subs or ratio <= 1.5x)"}
                </div>
              </div>
            </div>

            <button
              onClick={() => setInspectingVideo(null)}
              className="w-full mt-6 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-colors"
            >
              Close Breakdown
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
