"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  Search,
  Bookmark,
  BookmarkCheck,
  Eye,
  ThumbsUp,
  MessageSquare,
  ExternalLink,
  Sparkles,
  Info,
  Clock,
  ArrowUpDown,
  RefreshCw,
  FolderHeart,
  Video as VideoIcon,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import {
  SearchResponse,
  VideoItem,
  SavedVideo,
  SaveVideoPayload,
} from "@/types/research";
import { searchVideos, saveVideo, getSavedVideos } from "@/lib/api";
import { cn, formatCompactNumber, formatDate } from "@/lib/utils";

const PRESET_QUERIES = [
  "Python Tutorial",
  "AI Coding Tools",
  "Next.js Full Course",
  "YouTube Algorithm 2026",
];

const DURATION_TABS = [
  { id: "all", label: "All Durations" },
  { id: "short", label: "Shorts (<4m)" },
  { id: "medium", label: "Medium (4–20m)" },
  { id: "long", label: "Deep Dives (>20m)" },
] as const;

const SORT_OPTIONS = [
  { id: "relevance", label: "Most Relevant" },
  { id: "viewCount", label: "Most Viewed" },
  { id: "date", label: "Recently Published" },
  { id: "rating", label: "Highest Rated" },
] as const;

export default function ResearchPage() {
  const [activeTab, setActiveTab] = useState<"search" | "saved">("search");
  const [query, setQuery] = useState("python tutorial");
  const [searchInput, setSearchInput] = useState("python tutorial");
  const [sortOrder, setSortOrder] = useState<string>("relevance");
  const [durationFilter, setDurationFilter] = useState<string>("all");

  const [isLoading, setIsLoading] = useState(false);
  const [searchData, setSearchData] = useState<SearchResponse | null>(null);
  const [savedVideos, setSavedVideos] = useState<SavedVideo[]>([]);
  const [isSavedLoading, setIsSavedLoading] = useState(false);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [savedVideoIds, setSavedVideoIds] = useState<Set<string>>(new Set());

  // Fetch saved videos from database
  const loadSavedVideos = useCallback(async () => {
    setIsSavedLoading(true);
    try {
      const data = await getSavedVideos();
      setSavedVideos(data);
      setSavedVideoIds(new Set(data.map((v) => v.youtube_video_id)));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load saved videos";
      toast.error(message);
    } finally {
      setIsSavedLoading(false);
    }
  }, []);

  // Search videos
  const executeSearch = useCallback(
    async (
      qToSearch: string,
      order: string = sortOrder,
      duration: string = durationFilter
    ) => {
      if (!qToSearch.trim()) {
        toast.warning("Please enter a search topic or keyword");
        return;
      }
      setIsLoading(true);
      try {
        const res = await searchVideos(qToSearch, order, duration, 24);
        setSearchData(res);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Search failed. Is backend running?";
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [sortOrder, durationFilter]
  );

  // Initial load
  useEffect(() => {
    executeSearch(query, sortOrder, durationFilter);
    loadSavedVideos();
  }, [executeSearch, loadSavedVideos, query, sortOrder, durationFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(searchInput);
    executeSearch(searchInput, sortOrder, durationFilter);
  };

  const handlePresetClick = (preset: string) => {
    setSearchInput(preset);
    setQuery(preset);
    executeSearch(preset, sortOrder, durationFilter);
  };

  const handleDurationChange = (val: string) => {
    setDurationFilter(val);
    executeSearch(query, sortOrder, val);
  };

  const handleSortChange = (val: string) => {
    setSortOrder(val);
    executeSearch(query, val, durationFilter);
  };

  // Save video action
  const handleSaveVideo = async (video: VideoItem) => {
    if (savedVideoIds.has(video.youtube_video_id) || savingIds.has(video.youtube_video_id)) {
      return;
    }

    setSavingIds((prev) => new Set(prev).add(video.youtube_video_id));

    const payload: SaveVideoPayload = {
      youtube_video_id: video.youtube_video_id,
      title: video.title,
      description: video.description,
      published_at: video.published_at,
      channel_youtube_id: video.channel_id,
      channel_title: video.channel_title,
      thumbnail_url: video.thumbnail_url,
      duration_seconds: video.duration_seconds,
      view_count: video.view_count,
      like_count: video.like_count,
      comment_count: video.comment_count,
    };

    try {
      const savedResult = await saveVideo(payload);
      toast.success(`Saved to Research: "${video.title.slice(0, 45)}..."`, {
        description: `Baseline snapshot recorded with ${formatCompactNumber(video.view_count)} views.`,
      });

      // Update state
      setSavedVideoIds((prev) => new Set(prev).add(video.youtube_video_id));
      setSavedVideos((prev) => [savedResult, ...prev]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save video to database";
      toast.error(message);
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(video.youtube_video_id);
        return next;
      });
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Header & Tagline */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Research & Competitive Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            YouTube Research Engine
          </h1>
          <p className="mt-1 text-sm text-zinc-400 max-w-2xl">
            Analyze viral formats, track baseline metrics, and uncover high-performing
            video frameworks across your niche.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-zinc-900/80 border border-white/[0.08]">
          <button
            onClick={() => setActiveTab("search")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all",
              activeTab === "search"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Search className="h-4 w-4" />
            <span>Discover Videos</span>
            {searchData && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                {searchData.total_results}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab("saved");
              loadSavedVideos();
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all",
              activeTab === "saved"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <FolderHeart className="h-4 w-4" />
            <span>Saved Library</span>
            <span
              className={cn(
                "ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                activeTab === "saved"
                  ? "bg-white/20 text-white"
                  : "bg-indigo-500/20 text-indigo-400"
              )}
            >
              {savedVideos.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === "search" ? (
        <div className="mt-6 space-y-6">
          {/* Search Controls Card */}
          <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-white/[0.08] shadow-2xl">
            <form onSubmit={handleSearchSubmit} className="flex flex-col gap-4">
              {/* Primary Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search video topics, hooks, keywords (e.g. 'ai coding tutorial', 'retention editing')..."
                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-zinc-950/70 border border-white/[0.1] text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="h-12 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  <span>Search</span>
                </button>
              </div>

              {/* Filters & Sorting Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.06]">
                {/* Duration Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-zinc-400 mr-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Duration:
                  </span>
                  {DURATION_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleDurationChange(tab.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                        durationFilter === tab.id
                          ? "bg-indigo-600/30 text-indigo-300 ring-1 ring-indigo-500/50"
                          : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300 border border-white/[0.04]"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400" />
                  <span className="text-xs text-zinc-400">Sort by:</span>
                  <select
                    value={sortOrder}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="h-8 px-3 rounded-lg bg-zinc-900/80 border border-white/[0.1] text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id} className="bg-zinc-900 text-zinc-200">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-zinc-400">Popular:</span>
                {PRESET_QUERIES.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handlePresetClick(preset)}
                    className="px-2.5 py-1 rounded-md bg-white/[0.03] hover:bg-white/[0.08] text-[11px] text-zinc-400 hover:text-indigo-300 border border-white/[0.04] transition-all"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </form>
          </div>

          {/* Mock Data Notice Banner */}
          {searchData?.is_mock && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs sm:text-sm">
              <Info className="h-5 w-5 flex-shrink-0 text-amber-400" />
              <div className="flex-1">
                <span className="font-semibold text-amber-200">Development Mode:</span>{" "}
                Simulated YouTube API Data (Add <code className="bg-amber-950/60 px-1 py-0.5 rounded text-amber-300 font-mono text-xs">YOUTUBE_API_KEY</code> in <code className="bg-amber-950/60 px-1 py-0.5 rounded text-amber-300 font-mono text-xs">backend/.env</code> for live queries).
              </div>
            </div>
          )}

          {/* Results Stats Bar */}
          <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
            <div>
              Showing results for <span className="font-semibold text-zinc-200">&quot;{query}&quot;</span>
              {searchData && ` (${searchData.items.length} videos)`}
            </div>
            {isLoading && (
              <div className="flex items-center gap-2 text-indigo-400">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Searching YouTube...</span>
              </div>
            )}
          </div>

          {/* Video Grid */}
          {searchData && searchData.items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {searchData.items.map((video) => {
                const isSaved = savedVideoIds.has(video.youtube_video_id);
                const isSaving = savingIds.has(video.youtube_video_id);

                return (
                  <div
                    key={video.youtube_video_id}
                    className="glass-panel glass-panel-hover rounded-2xl overflow-hidden flex flex-col group"
                  >
                    {/* Thumbnail Container */}
                    <div className="relative aspect-video w-full bg-zinc-900 overflow-hidden">
                      {video.thumbnail_url ? (
                        <Image
                          src={video.thumbnail_url}
                          alt={video.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-zinc-500">
                          <VideoIcon className="h-10 w-10" />
                        </div>
                      )}

                      {/* Scrim Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />

                      {/* Duration Badge */}
                      <div className="absolute bottom-2.5 right-2.5 rounded-md bg-black/85 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                        {video.duration_formatted}
                      </div>

                      {/* External Link Overlay Button */}
                      <a
                        href={video.youtube_url}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute top-2.5 right-2.5 h-8 w-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                        title="Watch on YouTube"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                      <div>
                        {/* Channel Title */}
                        <div className="text-xs font-medium text-indigo-400 line-clamp-1 mb-1">
                          {video.channel_title}
                        </div>

                        {/* Video Title */}
                        <a
                          href={video.youtube_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-zinc-100 line-clamp-2 hover:text-indigo-300 transition-colors"
                          title={video.title}
                        >
                          {video.title}
                        </a>
                      </div>

                      {/* Metrics Row */}
                      <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
                        <div className="flex items-center gap-1" title={`${video.view_count.toLocaleString()} views`}>
                          <Eye className="h-3.5 w-3.5 text-zinc-500" />
                          <span>{formatCompactNumber(video.view_count)}</span>
                        </div>
                        <div className="flex items-center gap-1" title={`${video.like_count.toLocaleString()} likes`}>
                          <ThumbsUp className="h-3.5 w-3.5 text-zinc-500" />
                          <span>{formatCompactNumber(video.like_count)}</span>
                        </div>
                        <div className="flex items-center gap-1" title={`${video.comment_count.toLocaleString()} comments`}>
                          <MessageSquare className="h-3.5 w-3.5 text-zinc-500" />
                          <span>{formatCompactNumber(video.comment_count)}</span>
                        </div>
                      </div>

                      {/* Save Action Button */}
                      <button
                        type="button"
                        onClick={() => handleSaveVideo(video)}
                        disabled={isSaved || isSaving}
                        className={cn(
                          "w-full h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all mt-1",
                          isSaved
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 cursor-default"
                            : "bg-zinc-800/80 hover:bg-indigo-600 hover:text-white text-zinc-200 border border-white/[0.08]"
                        )}
                      >
                        {isSaving ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : isSaved ? (
                          <>
                            <BookmarkCheck className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Saved in Library</span>
                          </>
                        ) : (
                          <>
                            <Bookmark className="h-3.5 w-3.5" />
                            <span>Save to Research</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : !isLoading ? (
            <div className="glass-panel rounded-2xl p-12 text-center border border-white/[0.08]">
              <AlertCircle className="mx-auto h-12 w-12 text-zinc-500 mb-3" />
              <h3 className="text-base font-semibold text-zinc-200">No videos found</h3>
              <p className="mt-1 text-sm text-zinc-400 max-w-sm mx-auto">
                Try searching with broader keywords or removing duration filters.
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        /* Saved Library Tab */
        <div className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Saved Research Library</span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                  {savedVideos.length} Saved
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Saved videos stored in PostgreSQL with baseline snapshot history.
              </p>
            </div>

            <button
              onClick={loadSavedVideos}
              disabled={isSavedLoading}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/[0.08] hover:bg-zinc-800 text-xs text-zinc-300 transition-colors"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isSavedLoading && "animate-spin")} />
              <span>Refresh</span>
            </button>
          </div>

          {savedVideos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {savedVideos.map((video) => (
                <div
                  key={video.id}
                  className="glass-panel glass-panel-hover rounded-2xl overflow-hidden flex flex-col group"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video w-full bg-zinc-900 overflow-hidden">
                    {video.thumbnail_url ? (
                      <Image
                        src={video.thumbnail_url}
                        alt={video.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-zinc-500">
                        <VideoIcon className="h-10 w-10" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                    {video.duration_formatted && (
                      <div className="absolute bottom-2.5 right-2.5 rounded-md bg-black/85 px-2 py-0.5 text-[11px] font-semibold text-white">
                        {video.duration_formatted}
                      </div>
                    )}
                    <a
                      href={`https://www.youtube.com/watch?v=${video.youtube_video_id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute top-2.5 right-2.5 h-8 w-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Watch on YouTube"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>

                  {/* Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <div>
                      <div className="text-xs font-medium text-indigo-400 line-clamp-1 mb-1">
                        {video.channel_title || "Unknown Channel"}
                      </div>
                      <a
                        href={`https://www.youtube.com/watch?v=${video.youtube_video_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold text-zinc-100 line-clamp-2 hover:text-indigo-300 transition-colors"
                      >
                        {video.title}
                      </a>
                    </div>

                    {/* Snapshot Baseline Badge */}
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 bg-zinc-900/90 rounded-lg px-2.5 py-1.5 border border-white/[0.04]">
                      <span className="flex items-center gap-1 text-emerald-400 font-medium">
                        <CheckCircle2 className="h-3 w-3" />
                        Baseline Tracking
                      </span>
                      <span className="text-zinc-500 font-mono">
                        {video.snapshot_count} snapshot{video.snapshot_count !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5 text-zinc-500" />
                        <span>{formatCompactNumber(video.view_count)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-3.5 w-3.5 text-zinc-500" />
                        <span>{formatCompactNumber(video.like_count)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5 text-zinc-500" />
                        <span>{formatCompactNumber(video.comment_count)}</span>
                      </div>
                    </div>

                    <div className="text-[10px] text-zinc-500 text-right">
                      Saved {formatDate(video.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-12 text-center border border-white/[0.08]">
              <FolderHeart className="mx-auto h-12 w-12 text-zinc-500 mb-3" />
              <h3 className="text-base font-semibold text-zinc-200">No saved videos yet</h3>
              <p className="mt-1 text-sm text-zinc-400 max-w-sm mx-auto">
                Search for videos in the Discover tab and click &quot;Save to Research&quot; to begin building your competitive database.
              </p>
              <button
                onClick={() => setActiveTab("search")}
                className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition-all"
              >
                Go to Discover Videos
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
