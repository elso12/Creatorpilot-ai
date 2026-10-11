"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CalendarDays,
  Plus,
  Search,
  Star,
  Trash2,
  Edit3,
  Copy,
  Check,
  Video,
  Flame,
  ArrowRight,
  RefreshCw,
  X,
  Filter,
  Layers,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import {
  PlannerIdea,
  IdeaStatus,
  IdeaFormat,
  CreatePlannerIdeaPayload,
  UpdatePlannerIdeaPayload,
} from "@/types/planner";
import {
  getPlannerIdeas,
  createPlannerIdea,
  updatePlannerIdea,
  deletePlannerIdea,
} from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";

const STAGES: { id: IdeaStatus; title: string; color: string; border: string; badge: string }[] = [
  {
    id: "Idea",
    title: "Ideas",
    color: "text-amber-300",
    border: "border-amber-500/20 bg-amber-500/[0.03]",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  {
    id: "Researching",
    title: "Researching",
    color: "text-blue-300",
    border: "border-blue-500/20 bg-blue-500/[0.03]",
    badge: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  },
  {
    id: "Ready",
    title: "Ready to Script/Record",
    color: "text-purple-300",
    border: "border-purple-500/20 bg-purple-500/[0.03]",
    badge: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  },
  {
    id: "Published",
    title: "Published",
    color: "text-emerald-300",
    border: "border-emerald-500/20 bg-emerald-500/[0.03]",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  {
    id: "Reviewed",
    title: "Reviewed",
    color: "text-zinc-400",
    border: "border-zinc-700/30 bg-zinc-800/[0.1]",
    badge: "bg-zinc-800 text-zinc-300 border-zinc-700/50",
  },
];

export default function PlannerPage() {
  const [ideas, setIdeas] = useState<PlannerIdea[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [formatFilter, setFormatFilter] = useState<"all" | "long_form" | "shorts">("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  // Modals & Drawers
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<PlannerIdea | null>(null);

  // Form states for creation
  const [newTitle, setNewTitle] = useState("");
  const [newHook, setNewHook] = useState("");
  const [newOutline, setNewOutline] = useState("");
  const [newAudience, setNewAudience] = useState("Full-Stack Web Developers");
  const [newFormat, setNewFormat] = useState<IdeaFormat>("long_form");
  const [newStatus, setNewStatus] = useState<IdeaStatus>("Idea");
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Copy feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadIdeas = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getPlannerIdeas({
        search: searchQuery.trim() || undefined,
        format: formatFilter !== "all" ? formatFilter : undefined,
        is_favorite: favoritesOnly ? true : undefined,
      });
      setIdeas(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load ideas";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, formatFilter, favoritesOnly]);

  useEffect(() => {
    loadIdeas();
  }, [loadIdeas]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleToggleFavorite = async (idea: PlannerIdea) => {
    try {
      const updated = await updatePlannerIdea(idea.id, {
        is_favorite: !idea.is_favorite,
      });
      setIdeas((prev) => prev.map((item) => (item.id === idea.id ? updated : item)));
      toast.success(
        updated.is_favorite
          ? `Added "${idea.title.slice(0, 25)}..." to favorites`
          : `Removed from favorites`
      );
    } catch {
      toast.error("Failed to update favorite");
    }
  };

  const handleMoveStatus = async (idea: PlannerIdea, nextStatus: IdeaStatus) => {
    try {
      const updated = await updatePlannerIdea(idea.id, { status: nextStatus });
      setIdeas((prev) => prev.map((item) => (item.id === idea.id ? updated : item)));
      toast.success(`Moved to ${nextStatus}!`);
      if (editingIdea && editingIdea.id === idea.id) {
        setEditingIdea(updated);
      }
    } catch {
      toast.error("Failed to move idea status");
    }
  };

  const handleDelete = async (idea: PlannerIdea) => {
    if (!confirm(`Delete idea "${idea.title}"?`)) return;
    try {
      await deletePlannerIdea(idea.id);
      setIdeas((prev) => prev.filter((item) => item.id !== idea.id));
      if (editingIdea && editingIdea.id === idea.id) {
        setEditingIdea(null);
      }
      toast.info(`Deleted idea "${idea.title.slice(0, 30)}..."`);
    } catch {
      toast.error("Failed to delete idea");
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.warning("Title is required");
      return;
    }

    setIsSubmittingCreate(true);
    try {
      const payload: CreatePlannerIdeaPayload = {
        title: newTitle.trim(),
        hook: newHook.trim() || undefined,
        script_outline: newOutline.trim() || undefined,
        target_audience: newAudience.trim() || undefined,
        format: newFormat,
        status: newStatus,
        is_favorite: false,
      };

      const created = await createPlannerIdea(payload);
      setIdeas((prev) => [created, ...prev]);
      toast.success(`Created "${created.title.slice(0, 30)}..."`);
      setIsCreateOpen(false);

      // Reset
      setNewTitle("");
      setNewHook("");
      setNewOutline("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create idea";
      toast.error(msg);
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIdea) return;

    try {
      const payload: UpdatePlannerIdeaPayload = {
        title: editingIdea.title,
        hook: editingIdea.hook || undefined,
        script_outline: editingIdea.script_outline || undefined,
        target_audience: editingIdea.target_audience || undefined,
        research_notes: editingIdea.research_notes || undefined,
        format: editingIdea.format,
        status: editingIdea.status,
      };

      const updated = await updatePlannerIdea(editingIdea.id, payload);
      setIdeas((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      toast.success("Idea updated!");
      setEditingIdea(null);
    } catch {
      toast.error("Failed to save changes");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium mb-3">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>Content Pipeline & Production Board</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Content Planner & Kanban Board
          </h1>
          <p className="mt-1 text-sm text-zinc-400 max-w-2xl">
            Track video concepts across stages from raw ideation and research to scripting and published releases.
          </p>
        </div>

        {/* Action Button */}
        <div>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="h-10 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>New Video Idea</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-6 glass-panel rounded-2xl p-4 border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ideas, hooks, or audiences..."
            className="w-full h-9 pl-9 pr-3 rounded-xl bg-zinc-900 border border-white/[0.1] text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Format selector */}
          <div className="flex items-center bg-zinc-900 rounded-xl p-1 border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setFormatFilter("all")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
                formatFilter === "all" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
              )}
            >
              All Formats
            </button>
            <button
              type="button"
              onClick={() => setFormatFilter("long_form")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1",
                formatFilter === "long_form"
                  ? "bg-indigo-600/30 text-indigo-300"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <Video className="h-3 w-3" />
              <span>Long-Form</span>
            </button>
            <button
              type="button"
              onClick={() => setFormatFilter("shorts")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1",
                formatFilter === "shorts"
                  ? "bg-amber-600/30 text-amber-300"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <Flame className="h-3 w-3" />
              <span>Shorts</span>
            </button>
          </div>

          {/* Favorites filter toggle */}
          <button
            type="button"
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={cn(
              "h-9 px-3 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all",
              favoritesOnly
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border-white/[0.08]"
            )}
          >
            <Star className={cn("h-3.5 w-3.5", favoritesOnly && "fill-amber-400 text-amber-400")} />
            <span>Favorites</span>
          </button>

          {/* Refresh */}
          <button
            type="button"
            onClick={loadIdeas}
            className="h-9 px-2.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-zinc-400 hover:text-white transition-colors"
            title="Refresh ideas"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Kanban Board Grid: 5 Columns */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
        {STAGES.map((col) => {
          const colIdeas = ideas.filter((item) => item.status === col.id);

          return (
            <div
              key={col.id}
              className={cn(
                "rounded-2xl p-3 border min-h-[500px] flex flex-col glass-panel",
                col.border
              )}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <h3 className={cn("text-xs font-bold uppercase tracking-wider", col.color)}>
                    {col.title}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/[0.06] text-zinc-300">
                    {colIdeas.length}
                  </span>
                </div>
              </div>

              {/* Ideas Cards in Column */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[680px] pr-1">
                {colIdeas.length === 0 ? (
                  <div className="text-center py-8 text-[11px] text-zinc-500 italic">
                    No ideas in this stage
                  </div>
                ) : (
                  colIdeas.map((idea) => {
                    const isShort = idea.format === "shorts";

                    return (
                      <div
                        key={idea.id}
                        onClick={() => setEditingIdea(idea)}
                        className="glass-panel p-3.5 rounded-xl border border-white/[0.08] hover:border-indigo-500/40 hover:bg-white/[0.02] cursor-pointer transition-all space-y-2 group relative"
                      >
                        {/* Top Badges & Actions */}
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1",
                              isShort
                                ? "bg-amber-500/20 text-amber-300"
                                : "bg-indigo-500/20 text-indigo-300"
                            )}
                          >
                            {isShort ? <Flame className="h-2.5 w-2.5" /> : <Video className="h-2.5 w-2.5" />}
                            <span>{isShort ? "Shorts" : "Long-Form"}</span>
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFavorite(idea);
                              }}
                              className="text-zinc-500 hover:text-amber-400 p-0.5 transition-colors"
                              title="Toggle favorite"
                            >
                              <Star
                                className={cn(
                                  "h-3.5 w-3.5",
                                  idea.is_favorite
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-zinc-600"
                                )}
                              />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(idea);
                              }}
                              className="text-zinc-500 hover:text-rose-400 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete idea"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-bold text-zinc-100 leading-snug line-clamp-2">
                          {idea.title}
                        </h4>

                        {/* Hook preview snippet if exists */}
                        {idea.hook && (
                          <p className="text-[11px] text-zinc-400 line-clamp-2 italic">
                            &ldquo;{idea.hook}&rdquo;
                          </p>
                        )}

                        {/* Footer info & Stage Selector */}
                        <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between gap-1 text-[10px] text-zinc-500">
                          <span className="truncate max-w-[90px]">
                            {idea.target_audience || formatDate(idea.created_at)}
                          </span>

                          {/* Quick stage selector */}
                          <select
                            value={idea.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleMoveStatus(idea, e.target.value as IdeaStatus)}
                            className="h-6 px-1.5 rounded bg-zinc-900 border border-white/[0.08] text-[10px] text-zinc-300 focus:outline-none"
                          >
                            {STAGES.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* CREATE CUSTOM IDEA MODAL */}
      {/* ========================================================= */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel max-w-lg w-full rounded-3xl p-6 border border-white/[0.12] shadow-2xl relative">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Plus className="h-4 w-4 text-indigo-400" />
              <span>Create Custom Video Idea</span>
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Add a concept to your production pipeline manually.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Video Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Why Senior Devs Don't Use Next.js Server Actions"
                  className="w-full h-10 px-3 rounded-xl bg-zinc-950 border border-white/[0.1] text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Opening Hook (Spoken Pitch)
                </label>
                <textarea
                  rows={2}
                  value={newHook}
                  onChange={(e) => setNewHook(e.target.value)}
                  placeholder="First 10-15 seconds script hook..."
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-white/[0.1] text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Narrative Outline / Notes
                </label>
                <textarea
                  rows={3}
                  value={newOutline}
                  onChange={(e) => setNewOutline(e.target.value)}
                  placeholder="Key sections, timestamps, or talking points..."
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-white/[0.1] text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Target Audience
                  </label>
                  <input
                    type="text"
                    value={newAudience}
                    onChange={(e) => setNewAudience(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-zinc-950 border border-white/[0.1] text-xs text-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Initial Stage
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as IdeaStatus)}
                    className="w-full h-9 px-2.5 rounded-xl bg-zinc-950 border border-white/[0.1] text-xs text-zinc-200"
                  >
                    {STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Format</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewFormat("long_form")}
                    className={cn(
                      "py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all",
                      newFormat === "long_form"
                        ? "bg-indigo-600/30 text-indigo-300 border-indigo-500/50"
                        : "bg-zinc-950 text-zinc-400 border-white/[0.06]"
                    )}
                  >
                    <Video className="h-3.5 w-3.5" />
                    <span>Long-Form</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewFormat("shorts")}
                    className={cn(
                      "py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all",
                      newFormat === "shorts"
                        ? "bg-amber-600/30 text-amber-300 border-amber-500/50"
                        : "bg-zinc-950 text-zinc-400 border-white/[0.06]"
                    )}
                  >
                    <Flame className="h-3.5 w-3.5" />
                    <span>Shorts</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-xs font-semibold text-white shadow-md transition-all"
                >
                  Create Idea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* EDIT & DETAIL DRAWER / MODAL */}
      {/* ========================================================= */}
      {editingIdea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel max-w-xl w-full rounded-3xl p-6 border border-white/[0.12] shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditingIdea(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <span
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold border",
                  editingIdea.format === "shorts"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                )}
              >
                {editingIdea.format === "shorts" ? "Shorts" : "Long-Form"}
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                Created: {formatDate(editingIdea.created_at)}
              </span>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={editingIdea.title}
                  onChange={(e) =>
                    setEditingIdea({ ...editingIdea, title: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-xl bg-zinc-950 border border-white/[0.1] text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Hook with quick copy */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    Spoken Hook (First 15s)
                  </label>
                  {editingIdea.hook && (
                    <button
                      type="button"
                      onClick={() => handleCopy(editingIdea.hook || "", "hook-detail")}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      {copiedKey === "hook-detail" ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy Hook</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <textarea
                  rows={2}
                  value={editingIdea.hook || ""}
                  onChange={(e) =>
                    setEditingIdea({ ...editingIdea, hook: e.target.value })
                  }
                  placeholder="Enter hook words..."
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-white/[0.1] text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Outline with quick copy */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    Narrative Outline
                  </label>
                  {editingIdea.script_outline && (
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(editingIdea.script_outline || "", "outline-detail")
                      }
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      {copiedKey === "outline-detail" ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy Outline</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <textarea
                  rows={4}
                  value={editingIdea.script_outline || ""}
                  onChange={(e) =>
                    setEditingIdea({
                      ...editingIdea,
                      script_outline: e.target.value,
                    })
                  }
                  placeholder="Structured talking points..."
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-white/[0.1] text-xs font-mono text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Research Notes */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Research Notes & References
                </label>
                <textarea
                  rows={2}
                  value={editingIdea.research_notes || ""}
                  onChange={(e) =>
                    setEditingIdea({
                      ...editingIdea,
                      research_notes: e.target.value,
                    })
                  }
                  placeholder="Empirical data, citations, or URLs..."
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-white/[0.1] text-xs text-zinc-300"
                />
              </div>

              {/* Stage & Audience row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Stage Status
                  </label>
                  <select
                    value={editingIdea.status}
                    onChange={(e) =>
                      setEditingIdea({
                        ...editingIdea,
                        status: e.target.value as IdeaStatus,
                      })
                    }
                    className="w-full h-9 px-2.5 rounded-xl bg-zinc-950 border border-white/[0.1] text-xs text-zinc-200"
                  >
                    {STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Audience Tag
                  </label>
                  <input
                    type="text"
                    value={editingIdea.target_audience || ""}
                    onChange={(e) =>
                      setEditingIdea({
                        ...editingIdea,
                        target_audience: e.target.value,
                      })
                    }
                    className="w-full h-9 px-3 rounded-xl bg-zinc-950 border border-white/[0.1] text-xs text-zinc-200"
                  />
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleDelete(editingIdea)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Idea</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingIdea(null)}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
