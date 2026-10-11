export interface ScoreBreakdown {
  outlier_subscore: number;
  outlier_weight: number;
  outlier_points: number;
  velocity_subscore: number;
  velocity_weight: number;
  velocity_points: number;
  engagement_subscore: number;
  engagement_weight: number;
  engagement_points: number;
  small_channel_subscore: number;
  small_channel_weight: number;
  small_channel_points: number;
}

export interface CompetitorChannel {
  id: number;
  youtube_channel_id: string;
  title: string;
  custom_url?: string | null;
  description?: string | null;
  thumbnail_url?: string | null;
  subscriber_count: number;
  video_count: number;
  view_count: number;
  is_competitor: boolean;
  saved_videos_count: number;
  median_views: number;
  created_at: string;
  updated_at: string;
}

export interface CompetitorVideo {
  id: number;
  youtube_video_id: string;
  channel_id: number;
  channel_title: string;
  title: string;
  description?: string | null;
  published_at?: string | null;
  duration_seconds: number;
  duration_formatted: string;
  thumbnail_url?: string | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  opportunity_score: number;
  performance_ratio: number;
  views_per_day: number;
  engagement_rate: number;
  classification: "Breakout Outlier" | "Above Average" | "Average" | "Underperforming" | string;
  breakdown: ScoreBreakdown;
  youtube_url: string;
  created_at: string;
}

export interface SnapshotItemDetail {
  video_id: number;
  youtube_video_id: string;
  title: string;
  previous_views: number;
  current_views: number;
  views_delta: number;
  snapshot_count: number;
}

export interface CompetitorSnapshotResponse {
  channel_id: number;
  channel_title: string;
  videos_updated: number;
  total_views_delta: number;
  recorded_at: string;
  items: SnapshotItemDetail[];
}
