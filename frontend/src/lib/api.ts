import {
  SavedVideo,
  SaveVideoPayload,
  SearchResponse,
} from "@/types/research";
import {
  CompetitorChannel,
  CompetitorSnapshotResponse,
  CompetitorVideo,
} from "@/types/competitor";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// --- RESEARCH API ---

export async function searchVideos(
  query: string,
  order: string = "relevance",
  durationFilter: string = "all",
  maxResults: number = 20
): Promise<SearchResponse> {
  const params = new URLSearchParams({
    q: query,
    order: order,
    duration_filter: durationFilter,
    max_results: maxResults.toString(),
  });

  const res = await fetch(`${API_BASE_URL}/research/search?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(
      errorBody.detail || `Failed to search videos (Status: ${res.status})`
    );
  }

  return res.json();
}

export async function saveVideo(
  videoData: SaveVideoPayload
): Promise<SavedVideo> {
  const res = await fetch(`${API_BASE_URL}/research/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(videoData),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(
      errorBody.detail || `Failed to save video (Status: ${res.status})`
    );
  }

  return res.json();
}

export async function getSavedVideos(): Promise<SavedVideo[]> {
  const res = await fetch(`${API_BASE_URL}/research/saved`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(
      errorBody.detail || `Failed to fetch saved videos (Status: ${res.status})`
    );
  }

  return res.json();
}

// --- COMPETITORS API ---

export async function addCompetitor(
  identifier: string
): Promise<CompetitorChannel> {
  const res = await fetch(`${API_BASE_URL}/competitors/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ identifier }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(
      errorBody.detail || `Failed to add competitor (Status: ${res.status})`
    );
  }

  return res.json();
}

export async function getCompetitors(): Promise<CompetitorChannel[]> {
  const res = await fetch(`${API_BASE_URL}/competitors`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(
      errorBody.detail || `Failed to fetch competitors (Status: ${res.status})`
    );
  }

  return res.json();
}

export async function getCompetitorVideos(
  channelId: number,
  sortBy: string = "score"
): Promise<CompetitorVideo[]> {
  const res = await fetch(
    `${API_BASE_URL}/competitors/${channelId}/videos?sort_by=${sortBy}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(
      errorBody.detail || `Failed to fetch competitor videos (Status: ${res.status})`
    );
  }

  return res.json();
}

export async function recordCompetitorSnapshot(
  channelId: number
): Promise<CompetitorSnapshotResponse> {
  const res = await fetch(`${API_BASE_URL}/competitors/${channelId}/snapshot`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(
      errorBody.detail || `Failed to record snapshot (Status: ${res.status})`
    );
  }

  return res.json();
}

export async function deleteCompetitor(channelId: number): Promise<{
  status: string;
  channel_id: number;
  title?: string;
  message: string;
}> {
  const res = await fetch(`${API_BASE_URL}/competitors/${channelId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(
      errorBody.detail || `Failed to delete competitor (Status: ${res.status})`
    );
  }

  return res.json();
}

// --- AI STUDIO API ---

export async function generateContentPack(
  payload: import("@/types/ai").ContentPackRequest
): Promise<import("@/types/ai").ContentPackResponse> {
  const res = await fetch(`${API_BASE_URL}/ai/content-pack`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(
      errorBody.detail || `Failed to generate content pack (Status: ${res.status})`
    );
  }

  return res.json();
}

export async function generateResearchReport(
  payload: import("@/types/ai").ResearchReportRequest
): Promise<import("@/types/ai").ResearchReportResponse> {
  const res = await fetch(`${API_BASE_URL}/ai/research-report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(
      errorBody.detail || `Failed to generate research report (Status: ${res.status})`
    );
  }

  return res.json();
}

export async function saveContentIdea(
  payload: import("@/types/ai").SaveIdeaPayload
): Promise<import("@/types/ai").SavedIdea> {
  const res = await fetch(`${API_BASE_URL}/ai/save-idea`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(
      errorBody.detail || `Failed to save content idea (Status: ${res.status})`
    );
  }

  return res.json();
}

export async function getSavedContentIdeas(): Promise<
  import("@/types/ai").SavedIdea[]
> {
  const res = await fetch(`${API_BASE_URL}/ai/ideas`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(
      errorBody.detail || `Failed to fetch content ideas (Status: ${res.status})`
    );
  }

  return res.json();
}

// --- PLANNER API ---

export async function getPlannerIdeas(filters?: {
  status?: string;
  format?: string;
  is_favorite?: boolean;
  search?: string;
}): Promise<import("@/types/planner").PlannerIdea[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.append("status", filters.status);
  if (filters?.format) params.append("format", filters.format);
  if (filters?.is_favorite !== undefined)
    params.append("is_favorite", String(filters.is_favorite));
  if (filters?.search) params.append("search", filters.search);

  const url = `${API_BASE_URL}/planner/ideas${
    params.toString() ? `?${params.toString()}` : ""
  }`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(
      errorBody.detail || `Failed to fetch planner ideas (Status: ${res.status})`
    );
  }

  return res.json();
}

export async function createPlannerIdea(
  payload: import("@/types/planner").CreatePlannerIdeaPayload
): Promise<import("@/types/planner").PlannerIdea> {
  const res = await fetch(`${API_BASE_URL}/planner/ideas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(
      errorBody.detail || `Failed to create idea (Status: ${res.status})`
    );
  }

  return res.json();
}

export async function updatePlannerIdea(
  ideaId: number,
  payload: import("@/types/planner").UpdatePlannerIdeaPayload
): Promise<import("@/types/planner").PlannerIdea> {
  const res = await fetch(`${API_BASE_URL}/planner/ideas/${ideaId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(
      errorBody.detail || `Failed to update idea (Status: ${res.status})`
    );
  }

  return res.json();
}

export async function deletePlannerIdea(ideaId: number): Promise<{
  status: string;
  id: number;
  title: string;
  message: string;
}> {
  const res = await fetch(`${API_BASE_URL}/planner/ideas/${ideaId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(
      errorBody.detail || `Failed to delete idea (Status: ${res.status})`
    );
  }

  return res.json();
}

// --- DASHBOARD & DIAGNOSTICS API ---

export async function getDashboardOverview(): Promise<
  import("@/types/dashboard").DashboardOverviewResponse
> {
  const res = await fetch(`${API_BASE_URL}/dashboard/overview`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(
      errorBody.detail || `Failed to load dashboard overview (Status: ${res.status})`
    );
  }

  return res.json();
}

export async function getDiagnostics(): Promise<
  import("@/types/dashboard").DiagnosticsResponse
> {
  const res = await fetch(`${API_BASE_URL}/settings/diagnostics`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(
      errorBody.detail || `Failed to load diagnostics (Status: ${res.status})`
    );
  }

  return res.json();
}


