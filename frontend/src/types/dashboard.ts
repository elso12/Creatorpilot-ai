export interface DashboardOutlierVideo {
  id: number;
  youtube_video_id: string;
  title: string;
  channel_title: string;
  channel_id: number;
  thumbnail_url?: string;
  view_count: number;
  published_at?: string;
  opportunity_score: number;
  performance_ratio: number;
  classification: string;
  views_per_day: number;
  youtube_url: string;
}

export interface DashboardRecentVideo {
  id: number;
  youtube_video_id: string;
  title: string;
  channel_title: string;
  view_count: number;
  thumbnail_url?: string;
  duration_formatted?: string;
  created_at: string;
  youtube_url: string;
}

export interface DashboardOverviewResponse {
  total_saved_videos: number;
  total_tracked_competitors: number;
  total_ideas_in_pipeline: number;
  ideas_by_status: {
    Idea: number;
    Researching: number;
    Ready: number;
    Published: number;
    Reviewed: number;
    [key: string]: number;
  };
  top_opportunities: DashboardOutlierVideo[];
  recent_saved_videos: DashboardRecentVideo[];
  system_status: {
    database: string;
    youtube_api: string;
    gemini_api: string;
  };
}

export interface DiagnosticsResponse {
  database_status: {
    status: string;
    latency_ms: number;
    error?: string | null;
    dialect: string;
  };
  youtube_configured: boolean;
  youtube_key_snippet?: string | null;
  youtube_mode: string;
  gemini_configured: boolean;
  gemini_key_snippet?: string | null;
  gemini_mode: string;
  environment: string;
  project_name: string;
  debug: boolean;
}
