"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Sparkles,
  FileText,
  Copy,
  Check,
  BookmarkPlus,
  Play,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  FlaskConical,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Zap,
  Target,
  Clock,
  Layers,
  Palette,
  Eye,
  RefreshCw,
  Search,
  Video,
  Flame,
  Award,
} from "lucide-react";
import { toast } from "sonner";

import {
  ContentPackRequest,
  ContentPackResponse,
  ResearchReportRequest,
  ResearchReportResponse,
  TitleSuggestion,
  HookSuggestion,
  ThumbnailConcept,
  OutlineSection,
} from "@/types/ai";
import { SavedVideo } from "@/types/research";
import {
  generateContentPack,
  generateResearchReport,
  saveContentIdea,
  getSavedVideos,
} from "@/lib/api";
import { cn, formatCompactNumber } from "@/lib/utils";

const SAMPLE_TOPICS = [
  "Why Senior Engineers Don't Use Next.js Server Actions",
  "Building a Full-Stack AI Coding Agent From Scratch",
  "Docker in 2026: Why MicroVMs Are Replacing Containers",
  "10x Developer Productivity Hacks That Actually Work",
];

const ANGLE_COLORS: Record<string, string> = {
  "Contrarian / Hot Take": "bg-rose-500/15 text-rose-300 border-rose-500/30",
  "Curiosity Gap": "bg-purple-500/15 text-purple-300 border-purple-500/30",
  "High Stakes / Transformation": "bg-amber-500/15 text-amber-300 border-amber-500/30",
  "Clear Value / How-To": "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};

export default function AIStudioPage() {
  const [activeTab, setActiveTab] = useState<"generator" | "reports">("generator");

  // --- Content Pack Generator State ---
  const [topic, setTopic] = useState("Why Senior Engineers Don't Use Next.js Server Actions");
  const [targetAudience, setTargetAudience] = useState("Full-Stack Developers & Tech Leads");
  const [niche, setNiche] = useState("Software Engineering & Architecture");
  const [format, setFormat] = useState<"long_form" | "shorts">("long_form");
  const [tone, setTone] = useState("Educational, Direct, Practical");
  const [preferredLength, setPreferredLength] = useState("10-12 minutes");
  const [selectedVideoIds, setSelectedVideoIds] = useState<number[]>([]);
  const [savedVideosList, setSavedVideosList] = useState<SavedVideo[]>([]);
  const [isGeneratingPack, setIsGeneratingPack] = useState(false);
  const [contentPack, setContentPack] = useState<ContentPackResponse | null>(null);

  // Accordion state for outline
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({
    0: true,
    1: true,
  });

  // Copy feedback state
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);

  // --- Research Report State ---
  const [reportTopic, setReportTopic] = useState("Modern Web Architecture & AI Tooling");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [researchReport, setResearchReport] = useState<ResearchReportResponse | null>(null);

  // Load saved videos on mount to populate evidence picker
  useEffect(() => {
    async function fetchVideos() {
      try {
        const vids = await getSavedVideos();
        setSavedVideosList(vids);
      } catch {
        // Silent catch if no saved videos yet
      }
    }
    fetchVideos();
  }, []);

  // Copy text helper
  const handleCopy = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(identifier);
    toast.success("Copied to clipboard!");
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  // Toggle video selection in picker
  const toggleVideoSelection = (id: number) => {
    setSelectedVideoIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle outline section
  const toggleSection = (idx: number) => {
    setExpandedSections((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  // Generate Content Pack
  const handleGenerateContentPack = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim()) {
      toast.warning("Please provide a topic or raw concept");
      return;
    }

    setIsGeneratingPack(true);
    try {
      const payload: ContentPackRequest = {
        topic_or_concept: topic.trim(),
        target_audience: targetAudience.trim(),
        channel_niche: niche.trim(),
        format: format,
        tone: tone.trim(),
        preferred_length: preferredLength.trim(),
        referenced_video_ids: selectedVideoIds,
      };

      const res = await generateContentPack(payload);
      setContentPack(res);
      toast.success("Content Pack generated!", {
        description: res.is_mock
          ? "Generated with high-fidelity studio intelligence engine."
          : "Synthesized via Google Gemini 2.0 Flash.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate content pack";
      toast.error(msg);
    } finally {
      setIsGeneratingPack(false);
    }
  };

  // Save Concept to Pipeline
  const handleSaveConcept = async (
    titleObj: TitleSuggestion,
    idx: number
  ) => {
    setSavingIndex(idx);
    try {
      const firstHook = contentPack?.hooks?.[0]?.hook_text || "";
      const outlineSummary = contentPack?.outline
        ?.map((sec) => `${sec.section} (${sec.timestamp_target})`)
        .join("\n");

      await saveContentIdea({
        title: titleObj.title,
        hook: firstHook,
        script_outline: outlineSummary,
        target_audience: targetAudience,
        format: format,
        status: "Idea",
      });

      toast.success(`Saved "${titleObj.title.slice(0, 35)}..." to Content Pipeline!`, {
        description: "You can find this idea in your Content Planner.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save idea";
      toast.error(msg);
    } finally {
      setSavingIndex(null);
    }
  };

  // Generate Research Report
  const handleGenerateReport = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!reportTopic.trim()) {
      toast.warning("Please provide a keyword or research topic");
      return;
    }

    setIsGeneratingReport(true);
    try {
      const payload: ResearchReportRequest = {
        topic_or_keyword: reportTopic.trim(),
        video_ids: selectedVideoIds,
      };

      const res = await generateResearchReport(payload);
      setResearchReport(res);
      toast.success("Market Intelligence Report synthesized!", {
        description: `Analyzed ${res.data_summary.total_videos_analyzed} benchmark videos in this niche.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate report";
      toast.error(msg);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Content Studio & Synthesis Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            AI Content Studio & Market Reports
          </h1>
          <p className="mt-1 text-sm text-zinc-400 max-w-2xl">
            Transform raw developer concepts into multi-angle title architectures, psychological hooks,
            and empirically grounded research intelligence reports.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-zinc-900/90 p-1 rounded-2xl border border-white/[0.08]">
          <button
            type="button"
            onClick={() => setActiveTab("generator")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all",
              activeTab === "generator"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30"
                : "text-zinc-400 hover:text-white"
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Content Generator</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("reports")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all",
              activeTab === "reports"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30"
                : "text-zinc-400 hover:text-white"
            )}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Evidence Reports</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: CONTENT GENERATOR */}
      {/* ========================================================= */}
      {activeTab === "generator" && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form Controls (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            <div className="glass-panel rounded-2xl p-5 border border-white/[0.08]">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200 mb-4 flex items-center gap-2">
                <Target className="h-4 w-4 text-indigo-400" />
                <span>Strategy Configuration</span>
              </h2>

              <form onSubmit={handleGenerateContentPack} className="space-y-4">
                {/* Topic / Concept */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Topic / Raw Concept
                  </label>
                  <textarea
                    rows={3}
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Next.js 15 Server Actions gotchas or Rust memory model..."
                    className="w-full p-3 rounded-xl bg-zinc-950/70 border border-white/[0.1] text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                  {/* Sample Chips */}
                  <div className="mt-2 space-y-1">
                    <span className="text-[10px] text-zinc-500">Quick Prompts:</span>
                    <div className="flex flex-wrap gap-1">
                      {SAMPLE_TOPICS.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setTopic(item)}
                          className="text-[10px] text-zinc-400 hover:text-indigo-300 px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.05] truncate max-w-[200px]"
                          title={item}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Target Audience */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Target Audience
                  </label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-zinc-950/70 border border-white/[0.1] text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Channel Niche */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Channel Niche
                  </label>
                  <input
                    type="text"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-zinc-950/70 border border-white/[0.1] text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Format (Shorts vs Long-form) */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormat("long_form")}
                    className={cn(
                      "py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all",
                      format === "long_form"
                        ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/50 ring-1 ring-indigo-500/30"
                        : "bg-zinc-950/40 text-zinc-400 border-white/[0.06]"
                    )}
                  >
                    <Video className="h-3.5 w-3.5" />
                    <span>Long-Form</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat("shorts")}
                    className={cn(
                      "py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all",
                      format === "shorts"
                        ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/50 ring-1 ring-indigo-500/30"
                        : "bg-zinc-950/40 text-zinc-400 border-white/[0.06]"
                    )}
                  >
                    <Flame className="h-3.5 w-3.5" />
                    <span>Shorts</span>
                  </button>
                </div>

                {/* Tone & Length */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Tone</label>
                    <input
                      type="text"
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-lg bg-zinc-950/70 border border-white/[0.1] text-xs text-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Duration</label>
                    <input
                      type="text"
                      value={preferredLength}
                      onChange={(e) => setPreferredLength(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-lg bg-zinc-950/70 border border-white/[0.1] text-xs text-zinc-200"
                    />
                  </div>
                </div>

                {/* Attach Saved Research Videos Picker */}
                {savedVideosList.length > 0 && (
                  <div className="pt-2 border-t border-white/[0.06]">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-zinc-300">
                        Attach Evidence Data
                      </label>
                      <span className="text-[10px] text-indigo-400 font-medium">
                        {selectedVideoIds.length} attached
                      </span>
                    </div>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-zinc-950/50 border border-white/[0.06]">
                      {savedVideosList.map((vid) => {
                        const isSelected = selectedVideoIds.includes(vid.id);
                        return (
                          <div
                            key={vid.id}
                            onClick={() => toggleVideoSelection(vid.id)}
                            className={cn(
                              "p-2 rounded-lg cursor-pointer text-[11px] flex items-center justify-between gap-2 border transition-all",
                              isSelected
                                ? "bg-indigo-950/30 border-indigo-500/40 text-indigo-200"
                                : "bg-zinc-900/40 border-transparent text-zinc-400 hover:text-zinc-200"
                            )}
                          >
                            <span className="truncate flex-1">{vid.title}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {formatCompactNumber(vid.view_count)} views
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isGeneratingPack}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50 mt-2"
                >
                  {isGeneratingPack ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Synthesizing Studio Pack...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Generate Content Pack</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Content Pack Results View (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {!contentPack && !isGeneratingPack && (
              <div className="glass-panel rounded-2xl p-16 text-center border border-white/[0.08]">
                <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-7 w-7" />
                </div>
                <h3 className="text-base font-bold text-zinc-100">AI Studio Ready</h3>
                <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1 mb-6">
                  Configure your concept and click &quot;Generate Content Pack&quot; to synthesize multi-angle titles,
                  retention hooks, and complete production briefs.
                </p>
                <button
                  onClick={() => handleGenerateContentPack()}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all inline-flex items-center gap-2"
                >
                  <Zap className="h-4 w-4" />
                  <span>Try Sample Generator</span>
                </button>
              </div>
            )}

            {isGeneratingPack && (
              <div className="glass-panel rounded-2xl p-20 text-center border border-white/[0.08]">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-zinc-200">Engineering Content Architecture</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                  Applying psychological tension framing, generating 5 title angles, and crafting narrative outline...
                </p>
              </div>
            )}

            {contentPack && !isGeneratingPack && (
              <div className="space-y-6">
                {/* Core Hypothesis Banner */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-zinc-900 border border-indigo-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                      <Lightbulb className="h-4 w-4" />
                      <span>Core Strategic Thesis</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-400">
                      {contentPack.is_mock ? "Studio Intelligence Mode" : "Gemini 2.0 Flash"}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-200 font-medium leading-relaxed">
                    {contentPack.core_hypothesis}
                  </p>
                </div>

                {/* 1. Five Title Suggestions Across Angles */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-purple-400" />
                      <span>5 Psychological Title Architectures</span>
                    </h3>
                    <span className="text-[11px] text-zinc-500">Click card to copy or save</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {contentPack.titles.map((titleItem, idx) => {
                      const angleBadge =
                        ANGLE_COLORS[titleItem.angle] || "bg-indigo-500/15 text-indigo-300 border-indigo-500/30";
                      const isCopied = copiedIndex === `title-${idx}`;
                      const isSaving = savingIndex === idx;

                      return (
                        <div
                          key={idx}
                          className="glass-panel rounded-xl p-4 border border-white/[0.06] hover:border-white/[0.15] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                                  angleBadge
                                )}
                              >
                                {titleItem.angle}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-white group-hover:text-indigo-200 transition-colors">
                              {titleItem.title}
                            </h4>
                            <p className="text-[11px] text-zinc-400 mt-1">
                              {titleItem.rationale}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => handleCopy(titleItem.title, `title-${idx}`)}
                              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/[0.08] transition-colors"
                              title="Copy title"
                            >
                              {isCopied ? (
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSaveConcept(titleItem, idx)}
                              disabled={isSaving}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 hover:text-white text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                              title="Save to Content Planner"
                            >
                              <BookmarkPlus className="h-3.5 w-3.5" />
                              <span>Save to Planner</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Three Retention Hooks */}
                <div className="space-y-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                    <Play className="h-4 w-4 text-emerald-400" />
                    <span>3 Opening Retention Hooks (First 15s)</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {contentPack.hooks.map((hook, idx) => {
                      const isCopied = copiedIndex === `hook-${idx}`;

                      return (
                        <div
                          key={idx}
                          className="glass-panel rounded-xl p-4 border border-white/[0.06] flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                {hook.style}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(hook.hook_text, `hook-${idx}`)}
                                className="text-zinc-500 hover:text-white"
                                title="Copy spoken hook"
                              >
                                {isCopied ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                            <p className="text-xs text-zinc-200 font-medium italic leading-relaxed mb-3">
                              &ldquo;{hook.hook_text}&rdquo;
                            </p>
                          </div>

                          <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-white/[0.04]">
                            <div className="text-[10px] uppercase font-bold text-zinc-400 mb-0.5">
                              Pacing & Visual Cue:
                            </div>
                            <div className="text-[11px] text-zinc-400 leading-snug">
                              {hook.pacing_notes}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Interactive Chronological Outline */}
                <div className="space-y-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-indigo-400" />
                    <span>Narrative Outline & Retentive Pacing</span>
                  </h3>

                  <div className="space-y-2">
                    {contentPack.outline.map((sec, idx) => {
                      const isExpanded = expandedSections[idx] ?? true;

                      return (
                        <div
                          key={idx}
                          className="glass-panel rounded-xl border border-white/[0.06] overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() => toggleSection(idx)}
                            className="w-full p-3.5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-purple-300">
                                {sec.timestamp_target}
                              </span>
                              <span className="text-xs font-bold text-zinc-100">
                                {sec.section}
                              </span>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-zinc-500" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-zinc-500" />
                            )}
                          </button>

                          {isExpanded && sec.key_points && (
                            <div className="px-4 pb-3.5 pt-1 border-t border-white/[0.04] bg-zinc-950/40">
                              <ul className="space-y-1.5 text-xs text-zinc-400 list-disc list-inside">
                                {sec.key_points.map((pt, pIdx) => (
                                  <li key={pIdx} className="leading-relaxed">
                                    <span className="text-zinc-300">{pt}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Thumbnail Visual Briefs */}
                <div className="space-y-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                    <Palette className="h-4 w-4 text-amber-400" />
                    <span>Thumbnail Visual Concepts (Max 3-4 Words Overlay)</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contentPack.thumbnail_concepts.map((thumb, idx) => (
                      <div
                        key={idx}
                        className="glass-panel rounded-2xl p-5 border border-amber-500/20 bg-gradient-to-b from-amber-500/[0.03] to-transparent flex flex-col justify-between"
                      >
                        <div>
                          {/* Overlay Text Mock Badge */}
                          <div className="p-4 rounded-xl bg-zinc-950 border border-white/[0.08] mb-3 text-center flex flex-col items-center justify-center min-h-[90px] relative overflow-hidden group">
                            <div className="absolute top-2 right-2 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                              Overlay Preview
                            </div>
                            <span className="text-lg font-black tracking-tighter text-amber-300 bg-amber-500/20 px-3 py-1 rounded-lg border border-amber-500/40 transform group-hover:scale-105 transition-transform">
                              {thumb.overlay_text}
                            </span>
                          </div>

                          <div className="space-y-2 text-xs">
                            <div>
                              <span className="text-zinc-400 font-semibold">Visual Layout: </span>
                              <span className="text-zinc-200">{thumb.visual_composition}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-white/[0.04] text-[11px] text-zinc-400 flex items-center gap-2">
                          <Eye className="h-3.5 w-3.5 text-amber-400" />
                          <span>{thumb.color_contrast_notes}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. Series Ideas & Tags */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Series Ideas */}
                  <div className="glass-panel rounded-xl p-4 border border-white/[0.06]">
                    <div className="text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                      Follow-Up Series Concepts
                    </div>
                    <ul className="space-y-1.5 text-xs text-zinc-400">
                      {contentPack.series_ideas.map((s, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-purple-400 font-bold">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Tags & Keywords */}
                  <div className="glass-panel rounded-xl p-4 border border-white/[0.06]">
                    <div className="text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                      Target Search Keywords
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {contentPack.tags_and_keywords.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[11px] bg-white/[0.04] text-zinc-300 border border-white/[0.05]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: EVIDENCE-BASED REPORTS */}
      {/* ========================================================= */}
      {activeTab === "reports" && (
        <div className="mt-8 space-y-6">
          {/* Top Trigger Card */}
          <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-indigo-400" />
                <span>Empirical Market Intelligence Synthesis</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
                Ground your production decisions in verified YouTube market performance.
                Analyzes view distributions, identifies underserved content gaps, and suggests testable video experiments.
              </p>
            </div>

            <form onSubmit={handleGenerateReport} className="flex items-center gap-2 w-full md:w-auto">
              <input
                type="text"
                value={reportTopic}
                onChange={(e) => setReportTopic(e.target.value)}
                placeholder="Topic or keyword..."
                className="h-10 px-3.5 rounded-xl bg-zinc-900 border border-white/[0.1] text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-full md:w-72"
              />
              <button
                type="submit"
                disabled={isGeneratingReport}
                className="h-10 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 whitespace-nowrap"
              >
                {isGeneratingReport ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FlaskConical className="h-3.5 w-3.5" />
                )}
                <span>Synthesize Report</span>
              </button>
            </form>
          </div>

          {isGeneratingReport && (
            <div className="glass-panel rounded-2xl p-20 text-center border border-white/[0.08]">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-zinc-200">Analyzing Market Dataset</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                Synthesizing view velocity benchmarks, extracting market patterns, and designing controlled video experiments...
              </p>
            </div>
          )}

          {!researchReport && !isGeneratingReport && (
            <div className="glass-panel rounded-2xl p-16 text-center border border-white/[0.08]">
              <FileText className="h-12 w-12 text-zinc-500 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-zinc-200">No Report Generated Yet</h3>
              <p className="text-xs text-zinc-500 mt-1 mb-4">
                Enter a topic or niche keyword above and click &quot;Synthesize Report&quot; to produce an evidence-backed intelligence brief.
              </p>
              <button
                onClick={() => handleGenerateReport()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all"
              >
                Run Sample Report
              </button>
            </div>
          )}

          {researchReport && !isGeneratingReport && (
            <div className="space-y-6">
              {/* Report Header Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/[0.06]">
                <h3 className="text-xl font-extrabold text-white">
                  {researchReport.report_title}
                </h3>
                <span className="text-xs text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20 font-mono self-start sm:self-auto">
                  {researchReport.is_mock ? "Studio Analytics Mode" : "Gemini 2.0 Synthesis"}
                </span>
              </div>

              {/* Executive Summary Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-panel rounded-2xl p-5 border border-white/[0.08]">
                  <div className="text-xs uppercase font-bold text-zinc-400 tracking-wider">
                    Videos Analyzed
                  </div>
                  <div className="text-3xl font-black text-white mt-1">
                    {researchReport.data_summary.total_videos_analyzed}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    Empirical dataset sample size
                  </div>
                </div>

                <div className="glass-panel rounded-2xl p-5 border border-white/[0.08]">
                  <div className="text-xs uppercase font-bold text-zinc-400 tracking-wider">
                    Average Views
                  </div>
                  <div className="text-3xl font-black text-indigo-400 mt-1">
                    {formatCompactNumber(researchReport.data_summary.avg_views)}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    Niche benchmark views baseline
                  </div>
                </div>

                <div className="glass-panel rounded-2xl p-5 border border-white/[0.08]">
                  <div className="text-xs uppercase font-bold text-zinc-400 tracking-wider">
                    Top Outlier Multiple
                  </div>
                  <div className="text-3xl font-black text-emerald-400 mt-1">
                    {researchReport.data_summary.top_performer_ratio}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    Peak video vs channel median
                  </div>
                </div>
              </div>

              {/* Observed Patterns, Gaps, Risks Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Market Patterns */}
                <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5 mb-3">
                      <TrendingUp className="h-4 w-4" />
                      <span>Observed Market Patterns</span>
                    </h4>
                    <ul className="space-y-2.5 text-xs text-zinc-300">
                      {researchReport.observed_market_patterns.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 leading-relaxed">
                          <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 2. Content Gaps */}
                <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5 mb-3">
                      <Lightbulb className="h-4 w-4" />
                      <span>Underserved Content Gaps</span>
                    </h4>
                    <ul className="space-y-2.5 text-xs text-zinc-300">
                      {researchReport.content_gaps.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 leading-relaxed">
                          <span className="text-amber-400 font-bold mt-0.5">★</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 3. Risks & Caveats */}
                <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5 mb-3">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Risks & Audience Fatigue</span>
                    </h4>
                    <ul className="space-y-2.5 text-xs text-zinc-300">
                      {researchReport.risks_and_caveats.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 leading-relaxed">
                          <span className="text-rose-400 font-bold mt-0.5">⚠</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Suggested Video Experiments */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-purple-400" />
                    <span>Suggested Experiments & Empirical Hypotheses</span>
                  </h4>
                  <span className="text-xs text-zinc-500">Testable creative strategies</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {researchReport.suggested_experiments.map((exp, idx) => (
                    <div
                      key={idx}
                      className="glass-panel rounded-2xl p-5 border border-purple-500/20 bg-gradient-to-b from-purple-500/[0.03] to-transparent flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                            {exp.test_format}
                          </span>
                        </div>
                        <h5 className="text-sm font-bold text-white mb-2">{exp.concept}</h5>
                        <p className="text-xs text-zinc-300 leading-relaxed mb-4">
                          <span className="text-zinc-500 font-semibold">Hypothesis: </span>
                          {exp.hypothesis}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-zinc-950/70 border border-white/[0.06] text-[11px]">
                        <span className="text-emerald-400 font-bold">Success Target: </span>
                        <span className="text-zinc-300">{exp.success_metric}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cited Evidence Table */}
              {researchReport.cited_sources && researchReport.cited_sources.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                    <Award className="h-4 w-4 text-indigo-400" />
                    <span>Cited Benchmark Sources</span>
                  </h4>

                  <div className="overflow-hidden rounded-2xl border border-white/[0.08] glass-panel">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/[0.03] text-zinc-400 uppercase font-semibold text-[10px] tracking-wider border-b border-white/[0.06]">
                        <tr>
                          <th className="py-3 px-4">Video Title</th>
                          <th className="py-3 px-4">Channel</th>
                          <th className="py-3 px-4">Views</th>
                          <th className="py-3 px-4 text-right">Source Link</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {researchReport.cited_sources.map((src, idx) => (
                          <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 px-4 font-semibold text-zinc-100 max-w-sm truncate">
                              {src.title}
                            </td>
                            <td className="py-3 px-4 text-zinc-400">{src.channel}</td>
                            <td className="py-3 px-4 text-indigo-300 font-mono font-bold">
                              {formatCompactNumber(src.views)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <a
                                href={src.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-semibold"
                              >
                                <span>Watch</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
